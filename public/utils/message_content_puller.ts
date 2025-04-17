/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable, Subscriber } from 'rxjs';

/**
 * Giving 10 chars every 50 miliseconds,
 * the speed looks good in practice so we make it as default.
 */
const DEFAULT_JOB_INTERVAL = 50;
const DEFAULT_CONTENT_SLICE_LENGTH = 10;

interface IMessageContentPullerOptions {
  jobInterval: number;
  contentSliceLength: number;
  maxBufferLength: number;
  isContentReadyToUse: (messageContent: string) => boolean;
}

export class MessageContentPuller {
  // Backend may give large response in a single chunk,
  // use an observable here to buffer the large response.
  private messageContentChunk$: BehaviorSubject<Record<string, string>>;
  private messageContentTimer: ReturnType<typeof setTimeout> | null = null;
  private outputSubscriber: Subscriber<{ messageId: string; messageContent: string }> | null = null;
  private output$: Observable<{ messageId: string; messageContent: string }>;
  private inputCompleted: boolean = false;
  /**
   * This map is used to cache last slice length in case sliced content can not be flushed.
   */
  private lastContentSliceLengthMap: Record<string, number> = {};
  private options: IMessageContentPullerOptions;
  constructor(options?: Partial<IMessageContentPullerOptions>) {
    const {
      jobInterval = DEFAULT_JOB_INTERVAL,
      contentSliceLength = DEFAULT_CONTENT_SLICE_LENGTH,
      /**
       * use contentSliceLength * 5 as default
       * since hyberlink usually occupy 20-30 length
       */
      maxBufferLength = contentSliceLength * 5,
      isContentReadyToUse = () => true,
    } = options || {};
    this.messageContentChunk$ = new BehaviorSubject<Record<string, string>>({});
    this.options = {
      jobInterval,
      contentSliceLength,
      maxBufferLength,
      isContentReadyToUse,
    };
    this.output$ = new Observable((subscriber) => {
      this.outputSubscriber = subscriber;
    });
  }

  private handleSingleMessage(messageId: string) {
    const messageContent = this.messageContentChunk$.getValue()[messageId];
    const contentSliceLength =
      (this.lastContentSliceLengthMap[messageId] || 0) + this.options.contentSliceLength;
    const messageContentCandidate = messageContent.slice(0, contentSliceLength);
    const restContent = messageContent.slice(contentSliceLength);

    /**
     * We will emit the content when:
     *
     * 1. Input stream is closed and all the content has been pulled.
     * 2. The slice length exceeds the max buffer length client defined.
     * 3. The content is good to emit without special characters like hyberlink.
     */
    if (
      (this.inputCompleted && !restContent.length) ||
      contentSliceLength >= this.options.maxBufferLength ||
      this.options.isContentReadyToUse(messageContentCandidate)
    ) {
      this.outputSubscriber?.next({
        messageId,
        messageContent: messageContentCandidate,
      });

      const currentChunkMap = { ...this.messageContentChunk$.getValue() };
      if (restContent.length > 0) {
        currentChunkMap[messageId] = restContent;
      } else {
        delete currentChunkMap[messageId];
      }

      this.messageContentChunk$.next(currentChunkMap);
      this.lastContentSliceLengthMap[messageId] = 0;
    } else {
      this.lastContentSliceLengthMap[messageId] = contentSliceLength;
    }
  }

  private startMessageContentJob() {
    this.messageContentTimer = setTimeout(() => {
      try {
        Object.keys(this.messageContentChunk$.getValue()).forEach((messageId) => {
          this.handleSingleMessage(messageId);
        });

        if (this.inputCompleted && !Object.keys(this.messageContentChunk$.getValue()).length) {
          this.stop();
        } else {
          // Schedule next processing cycle
          this.startMessageContentJob();
        }
      } catch (e) {
        this.outputSubscriber?.error(e);
        this.stop();
      }
    }, this.options.jobInterval);
  }

  public addMessageContent(messageId: string, messageContent: string) {
    const currentContent = this.messageContentChunk$.getValue();
    const updatedContent = {
      ...currentContent,
      [messageId]: (currentContent[messageId] || '') + messageContent,
    };
    this.messageContentChunk$.next(updatedContent);
  }

  public getOutput$() {
    return this.output$;
  }

  public start() {
    this.startMessageContentJob();
  }

  public stop() {
    if (this.messageContentTimer) {
      clearTimeout(this.messageContentTimer);
      this.messageContentTimer = null;
    }

    if (this.outputSubscriber && !this.outputSubscriber.closed) {
      this.outputSubscriber.complete();
      this.outputSubscriber = null;
    }

    if (this.messageContentChunk$ && !this.messageContentChunk$.closed) {
      this.messageContentChunk$.complete();
      this.messageContentChunk$.unsubscribe();
    }

    this.lastContentSliceLengthMap = {};
  }

  /**
   * Unlike stop method, inputComplete will give a mark and the pool will stop itself once all the content has been emitted.
   */
  public inputComplete() {
    this.inputCompleted = true;
  }
}
