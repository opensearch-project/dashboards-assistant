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
  const ollyChatService: OllyChatService = new OllyChatService(contextMock, 'test');
  beforeEach(async () => {
    mockedTransport.mockClear();
    ollyChatService.resetRootAgentId();
  });

  it('requestLLM should invoke client call with correct params', async () => {
    mockedTransport.mockImplementation((args) => {
      if (args.path === '/_plugins/_ml/agents/_search') {
        return {
          body: {
            hits: {
              total: {
                value: 1,
              },
              hits: [
                {
                  _index: '.plugins-ml-agent',
                  _id: 'rootAgentId',
                },
              ],
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
            "body": Object {
              "query": Object {
                "term": Object {
                  "name.keyword": "test",
                },
              },
              "sort": Object {
                "created_time": "desc",
              },
            },
            "method": "GET",
            "path": "/_plugins/_ml/agents/_search",
          },
        ],
        Array [
          Object {
            "body": Object {
              "parameters": Object {
                "memory_id": "conversationId",
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
        "interactionId": "",
        "conversationId": "foo",
        "messages": Array [],
      }
    `);
  });

  it('requestLLM should throw error when transport.request throws error', async () => {
    mockedTransport
      .mockImplementationOnce(() => {
        return {
          body: {
            hits: {
              total: {
                value: 1,
              },
              hits: [
                {
                  _index: '.plugins-ml-agent',
                  _id: 'rootAgentId',
                },
              ],
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
      if (args.path === '/_plugins/_ml/agents/_search') {
        return {
          body: {
            hits: {
              total: {
                value: 1,
              },
              hits: [
                {
                  _index: '.plugins-ml-agent',
                  _id: 'rootAgentId',
                },
              ],
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
            "body": Object {
              "query": Object {
                "term": Object {
                  "name.keyword": "test",
                },
              },
              "sort": Object {
                "created_time": "desc",
              },
            },
            "method": "GET",
            "path": "/_plugins/_ml/agents/_search",
          },
        ],
        Array [
          Object {
            "body": Object {
              "parameters": Object {
                "memory_id": "conversationId",
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
        "interactionId": "",
        "conversationId": "foo",
        "messages": Array [],
      }
    `);
  });

  it('regenerate should throw error when transport.request throws error', async () => {
    mockedTransport
      .mockImplementationOnce(() => {
        return {
          body: {
            hits: {
              total: {
                value: 1,
              },
              hits: [
                {
                  _index: '.plugins-ml-agent',
                  _id: 'rootAgentId',
                },
              ],
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

  it('refetch the root agent id when executing agent throws 404 error', async () => {
    mockedTransport
      .mockImplementationOnce(() => {
        return {
          body: {
            hits: {
              total: {
                value: 1,
              },
              hits: [
                {
                  _index: '.plugins-ml-agent',
                  _id: 'rootAgentId',
                },
              ],
            },
          },
        };
      })
      .mockImplementationOnce(() => {
        const meta: ApiResponse = {
          body: {
            error: {
              type: 'resource_not_found_exception',
              reason: 'Agent not found',
            },
            status: 404,
          },
          statusCode: 404,
        };
        throw new ResponseError(meta);
      })
      .mockImplementationOnce(() => {
        return {
          body: {
            hits: {
              total: {
                value: 1,
              },
              hits: [
                {
                  _index: '.plugins-ml-agent',
                  _id: 'rootAgentId',
                },
              ],
            },
          },
        };
      })
      .mockImplementationOnce(() => {
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
    const result = await ollyChatService.requestLLM({
      messages: [],
      input: {
        type: 'input',
        contentType: 'text',
        content: 'content',
      },
      conversationId: '',
    });
    expect(mockedTransport.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "body": Object {
              "query": Object {
                "term": Object {
                  "name.keyword": "test",
                },
              },
              "sort": Object {
                "created_time": "desc",
              },
            },
            "method": "GET",
            "path": "/_plugins/_ml/agents/_search",
          },
        ],
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
        Array [
          Object {
            "body": Object {
              "query": Object {
                "term": Object {
                  "name.keyword": "test",
                },
              },
              "sort": Object {
                "created_time": "desc",
              },
            },
            "method": "GET",
            "path": "/_plugins/_ml/agents/_search",
          },
        ],
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
        "interactionId": "",
        "conversationId": "foo",
        "messages": Array [],
      }
    `);
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
      `[Error: search root agent failed, reason: Error: cannot find any root agent by name: test]`
    );
  });
});
