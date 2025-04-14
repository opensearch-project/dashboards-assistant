/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable, Subscriber } from 'rxjs';

const JOB_INTERVAL = 50;
const CONTENT_SLICE_LENGTH = 10;

export class MessageContentPool {
  // Backend may give large response in a single chunk,
  // use an observable here to buffer the large response.
  private messageContentChunk$: BehaviorSubject<Record<string, string>>;
  private messageContentTimer: ReturnType<typeof setTimeout> | null = null;
  private outputSubscriber: Subscriber<{ messageId: string; messageContent: string }> | null = null;
  private output$: Observable<{ messageId: string; messageContent: string }>;
  private inputCompleted: boolean = false;
  constructor() {
    this.messageContentChunk$ = new BehaviorSubject<Record<string, string>>({});
    this.output$ = new Observable((subscriber) => {
      this.outputSubscriber = subscriber;
    });
  }

  private startMessageContentJob() {
    this.messageContentTimer = setTimeout(() => {
      const restContents = Object.entries(this.messageContentChunk$.getValue()).reduce(
        (acc, cur) => {
          const [messageId, messageContent] = cur;
          this.outputSubscriber?.next({
            messageId,
            messageContent: messageContent.slice(0, CONTENT_SLICE_LENGTH),
          });
          const restContent = messageContent.slice(CONTENT_SLICE_LENGTH);
          if (restContent.length > 0) {
            return {
              ...acc,
              [messageId]: restContent,
            };
          }
          return acc;
        },
        {}
      );

      // Update the content pool with remaining content
      this.messageContentChunk$.next(restContents);

      if (this.inputCompleted && !Object.keys(restContents).length) {
        this.stop();
      } else {
        // Schedule the next processing cycle
        this.startMessageContentJob();
      }
    }, JOB_INTERVAL);
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
  }

  /**
   * Unlike stop method, inputComplete will give a mark and the pool will stop itself once all the content has been emitted.
   */
  public inputComplete() {
    this.inputCompleted = true;
  }
}
