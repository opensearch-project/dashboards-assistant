/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { LLMResponseType, useChatState } from './use_chat_state';
import { sreamDeserializer } from '../../common/utils/stream/serializer';
import { HttpResponse } from '../../../../src/core/public';
import { StreamChunk } from '../../common/types/chat_saved_object_attributes';

export const useGetChunksFromHTTPResponse = () => {
  const { chatStateDispatch } = useChatState();

  const getConsumedChunk$FromHttpResponse = async (props: {
    fetchResponse: HttpResponse<unknown>;
    abortController: AbortController;
  }) => {
    const chunk$ = new BehaviorSubject<StreamChunk | undefined>(undefined);
    props.abortController.signal.onabort = () => {
      chunk$.complete();
    };
    if (props.fetchResponse.response?.headers.get('X-Stream')) {
      chatStateDispatch({
        type: 'updateResponseType',
        payload: {
          type: LLMResponseType.STREAMING,
        },
      });
      const reader = props.fetchResponse.response?.body?.getReader();

      const decoder = new TextDecoder('utf-8');

      function processText({
        done,
        value,
      }: ReadableStreamReadResult<Uint8Array>): Promise<void> | void {
        if (done) {
          chunk$.complete();
          return;
        }
        const chunk = decoder.decode(value, { stream: true });
        try {
          const chunkObjects = sreamDeserializer(chunk);
          chunkObjects.forEach((chunkObject) => {
            chunk$.next(chunkObject);
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
        type: 'metadata',
        body: response,
      });

      // Complete right after next will only eat the emit value
      // add a setTimeout to delay it into next event loop
      setTimeout(() => {
        chunk$.complete();
      }, 0);
    }

    chunk$.subscribe(
      (chunk) => {
        if (chunk) {
          if (chunk.type === 'patch') {
            const { body } = chunk;
            chatStateDispatch({
              type: 'patch',
              payload: body,
            });
          } else if (chunk.type === 'error') {
            chatStateDispatch({ type: 'error', payload: new Error(chunk.body) });
            return;
          }
        }
      },
      (error) => {
        chatStateDispatch({ type: 'error', payload: error });
      },
      () => {
        chatStateDispatch({ type: 'llmRespondingChange', payload: { flag: false } });
      }
    );

    return chunk$;
  };

  return {
    getConsumedChunk$FromHttpResponse,
  };
};
