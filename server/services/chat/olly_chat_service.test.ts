/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OllyChatService } from './olly_chat_service';
import { CoreRouteHandlerContext } from '../../../../../src/core/server/core_route_handler_context';
import { coreMock, httpServerMock } from '../../../../../src/core/server/mocks';
import { loggerMock } from '../../../../../src/core/server/logging/logger.mock';
import { ResponseError } from '@opensearch-project/opensearch/lib/errors';
import { ApiResponse } from '@opensearch-project/opensearch';

describe('OllyChatService', () => {
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
  const ollyChatService: OllyChatService = new OllyChatService(contextMock);
  beforeEach(async () => {
    mockedTransport.mockClear();
  });

  it('requestLLM should invoke client call with correct params', async () => {
    mockedTransport.mockImplementation((args) => {
      if (args.path === '/_plugins/_ml/config/os_chat') {
        return {
          body: {
            type: 'os_chat_root_agent',
            configuration: {
              agent_id: '4qJKOo0BT01kB_DHroJv',
            },
          },
        };
      } else {
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
      }
    });
    const result = await ollyChatService.requestLLM({
      messages: [],
      input: {
        type: 'input',
        contentType: 'text',
        content: 'content',
      },
      conversationId: 'conversationId',
    });
    expect(mockedTransport.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "method": "GET",
            "path": "/_plugins/_ml/config/os_chat",
          },
        ],
        Array [
          Object {
            "body": Object {
              "parameters": Object {
                "memory_id": "conversationId",
                "question": "content",
                "verbose": false,
              },
            },
            "method": "POST",
            "path": "/_plugins/_ml/agents/4qJKOo0BT01kB_DHroJv/_execute",
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
        "conversationId": "foo",
        "interactionId": "",
        "messages": Array [],
      }
    `);
  });

  it('requestLLM should throw error when transport.request throws error', async () => {
    mockedTransport
      .mockImplementationOnce(() => {
        return {
          body: {
            type: 'os_chat_root_agent',
            configuration: {
              agent_id: '4qJKOo0BT01kB_DHroJv',
            },
          },
        };
      })
      .mockImplementationOnce(() => {
        throw new Error('error');
      });
    expect(
      ollyChatService.requestLLM({
        messages: [],
        input: {
          type: 'input',
          contentType: 'text',
          content: 'content',
        },
        conversationId: '',
      })
    ).rejects.toMatchInlineSnapshot(`[Error: error]`);
  });

  it('regenerate should invoke client call with correct params', async () => {
    mockedTransport.mockImplementation((args) => {
      if (args.path === '/_plugins/_ml/config/os_chat') {
        return {
          body: {
            type: 'os_chat_root_agent',
            configuration: {
              agent_id: '4qJKOo0BT01kB_DHroJv',
            },
          },
        };
      } else {
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
      }
    });
    const result = await ollyChatService.regenerate({
      conversationId: 'conversationId',
      interactionId: 'interactionId',
    });
    expect(mockedTransport.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "method": "GET",
            "path": "/_plugins/_ml/config/os_chat",
          },
        ],
        Array [
          Object {
            "body": Object {
              "parameters": Object {
                "memory_id": "conversationId",
                "regenerate_interaction_id": "interactionId",
                "verbose": false,
              },
            },
            "method": "POST",
            "path": "/_plugins/_ml/agents/4qJKOo0BT01kB_DHroJv/_execute",
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
        "conversationId": "foo",
        "interactionId": "",
        "messages": Array [],
      }
    `);
  });

  it('regenerate should throw error when transport.request throws error', async () => {
    mockedTransport
      .mockImplementationOnce(() => {
        return {
          body: {
            type: 'os_chat_root_agent',
            configuration: {
              agent_id: '4qJKOo0BT01kB_DHroJv',
            },
          },
        };
      })
      .mockImplementationOnce(() => {
        throw new Error('error');
      });
    expect(
      ollyChatService.regenerate({
        conversationId: 'conversationId',
        interactionId: 'interactionId',
      })
    ).rejects.toMatchInlineSnapshot(`[Error: error]`);
  });

  it('fetching root agent id throws error', async () => {
    mockedTransport.mockImplementationOnce(() => {
      return {
        body: {
          hits: {
            total: {
              value: 0,
            },
            hits: [],
          },
        },
      };
    });
    expect(
      ollyChatService.regenerate({
        conversationId: 'conversationId',
        interactionId: 'interactionId',
      })
    ).rejects.toMatchInlineSnapshot(
      `[Error: get root agent failed, reason: Error: cannot get root agent by calling the api: /_plugins/_ml/config/os_chat]`
    );
  });
});
