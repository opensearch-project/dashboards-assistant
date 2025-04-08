/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Subscription } from 'rxjs';
import { LLMResponseType, useChatState } from './use_chat_state';
import { streamDeserializer } from '../../common/utils/stream/serializer';
import { HttpResponse } from '../../../../src/core/public';
import { StreamChunk } from '../../common/types/chat_saved_object_attributes';
import { MessageContentPool } from '../utils/message_content_pool';

export const useGetChunksFromHTTPResponse = () => {
  const { chatStateDispatch } = useChatState();

  const getConsumedChunk$FromHttpResponse = async (props: {
    fetchResponse: HttpResponse<ReadableStream | Record<string, unknown>>;
    abortController: AbortController;
  }) => {
    const chunk$ = new BehaviorSubject<StreamChunk | undefined>(undefined);
    const messageContentPool = new MessageContentPool();
    props.abortController.signal.onabort = () => {
      messageContentPool.inputComplete();
    };
    if (props.fetchResponse.body?.getReader) {
      chatStateDispatch({
        type: 'updateResponseType',
        payload: {
          type: LLMResponseType.STREAMING,
        },
      });
      const reader = (props.fetchResponse.body as ReadableStream).getReader();

      const decoder = new TextDecoder();

      function processText({
        done,
        value,
      }: ReadableStreamReadResult<Uint8Array>): Promise<void> | void {
        if (done) {
          messageContentPool.inputComplete();
          return;
        }
        const chunk = decoder.decode(value);
        try {
          const chunkObjects = streamDeserializer(chunk);
          chunkObjects.forEach((chunkObject) => {
            if (chunkObject.event === 'appendMessage') {
              messageContentPool.addMessageContent(
                chunkObject.data.messageId,
                chunkObject.data.content
              );
            } else {
              chunk$.next(chunkObject);
            }
          });
        } catch (e) {
          // can not parse the chunk.
          chunk$.error(e);
        }
        return reader?.read().then(processText);
      }

      reader?.read().then(processText);
    } else {
      chatStateDispatch({
        type: 'updateResponseType',
        payload: {
          type: LLMResponseType.TEXT,
        },
      });
      const response = await props.fetchResponse.response?.json();
      chunk$.next({
        event: 'metadata',
        data: response,
      });

      // Complete right after next will only eat the emit value
      // add a setTimeout to delay it into next event loop
      setTimeout(() => {
        messageContentPool.inputComplete();
      }, 0);
    }

    const messageContentPoolSubscription = messageContentPool.getOutput$().subscribe({
      next: (message) => {
        chunk$.next({
          event: 'appendMessage',
          data: {
            messageId: message.messageId,
            content: message.messageContent,
          },
        });
      },
      complete: () => {
        chunk$.complete();
        messageContentPool.stop();
        messageContentPoolSubscription?.unsubscribe();
      },
    });

    messageContentPool.start();

    chunk$.subscribe(
      (chunk) => {
        if (chunk) {
          if (chunk.event === 'patch') {
            const { data } = chunk;
            chatStateDispatch({
              type: 'patch',
              payload: data,
            });
          } else if (chunk.event === 'appendMessage') {
            const { data } = chunk;
            chatStateDispatch({
              type: 'appendMessage',
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
