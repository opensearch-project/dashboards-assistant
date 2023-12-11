/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OllyChatService } from './olly_chat_service';
import { CoreRouteHandlerContext } from '../../../../../src/core/server/core_route_handler_context';
import { coreMock, httpServerMock } from '../../../../../src/core/server/mocks';
import { loggerMock } from '../../../../../src/core/server/logging/logger.mock';

describe('OllyChatService', () => {
  const ollyChatService = new OllyChatService();
  const coreContext = new CoreRouteHandlerContext(
    coreMock.createInternalStart(),
    httpServerMock.createOpenSearchDashboardsRequest()
  );
  const mockedTransport = coreContext.opensearch.client.asCurrentUser.transport
    .request as jest.Mock;
  const contextMock = {
    core: coreContext,
    assistant_plugin: {
      logger: loggerMock.create(),
    },
  };
  beforeEach(() => {
    mockedTransport.mockClear();
  });
  it('requestLLM should invoke client call with correct params', async () => {
    mockedTransport.mockImplementationOnce(() => {
      return {
        body: {
          inference_results: [
            {
              output: [
                {
                  name: 'memory_id',
                  result: 'foo',
                },
              ],
            },
          ],
        },
      };
    });
    const result = await ollyChatService.requestLLM(
      {
        messages: [],
        input: {
          type: 'input',
          contentType: 'text',
          content: 'content',
        },
        sessionId: '',
        rootAgentId: 'rootAgentId',
      },
      contextMock
    );
    expect(mockedTransport.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "body": Object {
              "parameters": Object {
                "question": "content",
                "verbose": true,
              },
            },
            "method": "POST",
            "path": "/_plugins/_ml/agents/rootAgentId/_execute",
          },
          Object {
            "maxRetries": 0,
            "requestTimeout": 300000,
          },
        ],
      ]
    `);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "memoryId": "foo",
        "messages": Array [],
      }
    `);
  });

  it('requestLLM should throw error when transport.request throws error', async () => {
    mockedTransport.mockImplementationOnce(() => {
      throw new Error('error');
    });
    expect(
      ollyChatService.requestLLM(
        {
          messages: [],
          input: {
            type: 'input',
            contentType: 'text',
            content: 'content',
          },
          sessionId: '',
          rootAgentId: 'rootAgentId',
        },
        contextMock
      )
    ).rejects.toMatchInlineSnapshot(`[Error: error]`);
  });

  it('regenerate should invoke client call with correct params', async () => {
    mockedTransport.mockImplementationOnce(() => {
      return {
        body: {
          inference_results: [
            {
              output: [
                {
                  name: 'memory_id',
                  result: 'foo',
                },
              ],
            },
          ],
        },
      };
    });
    const result = await ollyChatService.regenerate(
      {
        sessionId: 'sessionId',
        rootAgentId: 'rootAgentId',
        interactionId: 'interactionId',
      },
      contextMock
    );
    expect(mockedTransport.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "body": Object {
              "parameters": Object {
                "memory_id": "sessionId",
                "regenerate_interaction_id": "interactionId",
                "verbose": true,
              },
            },
            "method": "POST",
            "path": "/_plugins/_ml/agents/rootAgentId/_execute",
          },
          Object {
            "maxRetries": 0,
            "requestTimeout": 300000,
          },
        ],
      ]
    `);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "memoryId": "foo",
        "messages": Array [],
      }
    `);
  });

  it('regenerate should throw error when transport.request throws error', async () => {
    mockedTransport.mockImplementationOnce(() => {
      throw new Error('error');
    });
    expect(
      ollyChatService.regenerate(
        {
          sessionId: 'sessionId',
          rootAgentId: 'rootAgentId',
          interactionId: 'interactionId',
        },
        contextMock
      )
    ).rejects.toMatchInlineSnapshot(`[Error: error]`);
  });
});
