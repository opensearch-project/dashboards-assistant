/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReadableStream as NodeReadableStream } from 'stream/web';
import { useGetChunksFromHTTPResponse } from './use_get_chunks_from_http_response';
import * as chatStateHookExports from './use_chat_state';
import { streamSerializer } from '../../common/utils/stream/serializer';
import { waitFor } from '@testing-library/dom';

describe('useGetChunksFromHTTPResponse', () => {
  const chatStateDispatchMock = jest.fn();

  beforeEach(() => {
    jest.spyOn(chatStateHookExports, 'useChatState').mockReturnValue({
      chatState: { messages: [], interactions: [], llmResponding: false },
      chatStateDispatch: chatStateDispatchMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be able to parse event stream and dispatch default action', async () => {
    const { getConsumedChunk$FromHttpResponse } = useGetChunksFromHTTPResponse();
    const mockedEventStream = new NodeReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            streamSerializer({
              event: 'appendMessageContent',
              data: {
                messageId: 'a',
                content: 'a'.repeat(20),
              },
            })
          )
        );

        controller.enqueue(
          new TextEncoder().encode(
            streamSerializer({
              event: 'updateOutputMessage',
              data: {
                messageId: '',
                payload: {},
              },
            })
          )
        );

        controller.enqueue(
          new TextEncoder().encode(
            streamSerializer({
              event: 'error',
              data: 'error',
            })
          )
        );

        controller.close();
      },
    });

    const abortController = new AbortController();
    const chunk$ = await getConsumedChunk$FromHttpResponse({
      stream: mockedEventStream as ReadableStream,
      abortController,
    });

    await waitFor(() => {
      expect(chatStateDispatchMock).toHaveBeenCalledWith({
        type: 'updateResponseType',
        payload: {
          type: chatStateHookExports.LLMResponseType.STREAMING,
        },
      });

      expect(chatStateDispatchMock).toHaveBeenCalledWith({
        type: 'updateOutputMessage',
        payload: {
          messageId: '',
          payload: {},
        },
      });

      expect(chatStateDispatchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
        })
      );

      expect(chatStateDispatchMock).toHaveBeenNthCalledWith(4, {
        type: 'appendMessageContent',
        payload: {
          messageId: 'a',
          content: 'a'.repeat(10),
        },
      });

      expect(chatStateDispatchMock).toHaveBeenNthCalledWith(5, {
        type: 'appendMessageContent',
        payload: {
          messageId: 'a',
          content: 'a'.repeat(10),
        },
      });

      expect(chatStateDispatchMock).toHaveBeenCalledWith({
        type: 'llmRespondingChange',
        payload: { flag: false },
      });

      expect(chatStateDispatchMock).toHaveBeenCalledWith({
        type: 'updateResponseType',
        payload: {
          type: chatStateHookExports.LLMResponseType.TEXT,
        },
      });

      expect(chunk$.isStopped).toEqual(true);
    });
  });

  it('should abort reading streaming when abort controller get changed', async () => {
    const { getConsumedChunk$FromHttpResponse } = useGetChunksFromHTTPResponse();
    const mockedEventStream = new NodeReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            streamSerializer({
              event: 'updateOutputMessage',
              data: {
                messageId: '',
                payload: {},
              },
            })
          )
        );

        setTimeout(() => {
          controller.close();
        }, 5000);
      },
    });

    const abortController = new AbortController();
    const chunk$ = await getConsumedChunk$FromHttpResponse({
      stream: mockedEventStream as ReadableStream,
      abortController,
    });

    abortController.abort();

    await waitFor(() => {
      expect(chatStateDispatchMock).toHaveBeenCalledWith({
        type: 'updateResponseType',
        payload: {
          type: chatStateHookExports.LLMResponseType.STREAMING,
        },
      });

      expect(chatStateDispatchMock).toHaveBeenCalledWith({
        type: 'llmRespondingChange',
        payload: { flag: false },
      });

      expect(chunk$.isStopped).toEqual(true);
    });
  });
});
