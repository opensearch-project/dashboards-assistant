/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { LLMResponseType, useChatState } from './use_chat_state';
import { streamDeserializer } from '../../common/utils/stream/serializer';
import { HttpResponse } from '../../../../src/core/public';
import { SendResponse, StreamChunk } from '../../common/types/chat_saved_object_attributes';
import { MessageContentPuller } from '../utils/message_content_puller';

export const useGetChunksFromHTTPResponse = () => {
  const { chatStateDispatch } = useChatState();

  const getConsumedChunk$FromHttpResponse = async (props: {
    fetchResponse: HttpResponse<ReadableStream | Record<string, unknown>>;
    abortController: AbortController;
  }) => {
    const chunk$ = new BehaviorSubject<StreamChunk | undefined>(undefined);
    const messageContentPuller = new MessageContentPuller();
    props.abortController.signal.addEventListener('abort', () => {
      messageContentPuller.stop();
    });
    if (props.fetchResponse.body?.getReader) {
      chatStateDispatch({
        type: 'updateResponseType',
        payload: {
          type: LLMResponseType.STREAMING,
        },
      });
      const reader = (props.fetchResponse.body as ReadableStream).getReader();

      const decoder = new TextDecoder();

      async function processNextChunk() {
        try {
          if (props.abortController.signal.aborted) {
            // If the abort controller is aborted.
            // stop reading the stream.
            return;
          }
          const { done, value } = await reader.read();

          if (done) {
            messageContentPuller.inputComplete();
            return;
          }

          const chunk = decoder.decode(value);

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

          processNextChunk();
        } catch (error) {
          chunk$.error(error);
        }
      }

      processNextChunk();
    } else {
      chatStateDispatch({
        type: 'updateResponseType',
        payload: {
          type: LLMResponseType.TEXT,
        },
      });
      const response = (await props.fetchResponse.body) as Partial<SendResponse>;
      chunk$.next({
        event: 'metadata',
        data: response,
      });

      // Complete right after next will only eat the emit value
      // add a setTimeout to delay it into next event loop
      setTimeout(() => {
        messageContentPuller.inputComplete();
      }, 0);
    }

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
