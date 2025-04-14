/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { LLMResponseType, useChatState } from './use_chat_state';
import { streamDeserializer } from '../../common/utils/stream/serializer';
import { StreamChunk } from '../../common/types/chat_saved_object_attributes';
import { MessageContentPuller } from '../utils/message_content_puller';
import { convertEventStreamToObservable } from '../../common/utils/stream/stream_to_observable';

export const useGetChunksFromHTTPResponse = () => {
  const { chatStateDispatch } = useChatState();

  const getConsumedChunk$FromHttpResponse = async (props: {
    stream: ReadableStream;
    abortController: AbortController;
  }) => {
    const chunk$ = new BehaviorSubject<StreamChunk | undefined>(undefined);
    const messageContentPuller = new MessageContentPuller();
    const result = convertEventStreamToObservable(props.stream, props.abortController);
    props.abortController.signal.addEventListener('abort', () => {
      messageContentPuller.stop();
      result.cancel();
    });
    chatStateDispatch({
      type: 'updateResponseType',
      payload: {
        type: LLMResponseType.STREAMING,
      },
    });
    result.output$.subscribe({
      next: (chunk: string) => {
        try {
          const chunkObjects = streamDeserializer(chunk);
          for (const chunkObject of chunkObjects) {
            if (chunkObject.event === 'appendMessageContent') {
              messageContentPuller.addMessageContent(
                chunkObject.data.messageId,
                chunkObject.data.content
              );
            } else {
              chunk$.next(chunkObject);
            }
          }
        } catch (e) {
          chunk$.error(e);
          return;
        }
      },
      complete: () => {
        messageContentPuller.inputComplete();
      },
    });

    const messageContentPullerSubscription = messageContentPuller.getOutput$().subscribe({
      next: (message) => {
        chunk$.next({
          event: 'appendMessageContent',
          data: {
            messageId: message.messageId,
            content: message.messageContent,
          },
        });
      },
      complete: () => {
        chunk$.complete();
        messageContentPuller.stop();
        messageContentPullerSubscription?.unsubscribe();
      },
    });

    messageContentPuller.start();

    chunk$.subscribe(
      (chunk) => {
        if (chunk) {
          if (chunk.event === 'appendMessageContent') {
            const { data } = chunk;
            chatStateDispatch({
              type: 'appendMessageContent',
              payload: data,
            });
          } else if (chunk.event === 'updateOutputMessage') {
            const { data } = chunk;
            chatStateDispatch({
              type: 'updateOutputMessage',
              payload: data,
            });
          } else if (chunk.event === 'error') {
            chatStateDispatch({ type: 'error', payload: new Error(chunk.data) });
            return;
          }
        }
      },
      (error) => {
        chatStateDispatch({ type: 'error', payload: error });
        chatStateDispatch({
          type: 'updateResponseType',
          payload: {
            type: LLMResponseType.TEXT,
          },
        });
      },
      () => {
        chatStateDispatch({ type: 'llmRespondingChange', payload: { flag: false } });
        chatStateDispatch({
          type: 'updateResponseType',
          payload: {
            type: LLMResponseType.TEXT,
          },
        });
      }
    );

    return chunk$;
  };

  return {
    getConsumedChunk$FromHttpResponse,
  };
};
