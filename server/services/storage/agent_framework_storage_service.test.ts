/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentFrameworkStorageService } from './agent_framework_storage_service';
import { CoreRouteHandlerContext } from '../../../../../src/core/server/core_route_handler_context';
import { coreMock, httpServerMock } from '../../../../../src/core/server/mocks';

describe('AgentFrameworkStorageService', () => {
  const coreContext = new CoreRouteHandlerContext(
    coreMock.createInternalStart(),
    httpServerMock.createOpenSearchDashboardsRequest()
  );
  const mockedTransport = coreContext.opensearch.client.asCurrentUser.transport;
  const mockedTransportRequest = mockedTransport.request as jest.Mock;

  const agentFrameworkService = new AgentFrameworkStorageService(mockedTransport, []);
  beforeEach(() => {
    mockedTransportRequest.mockReset();
  });
  it('getConversation', async () => {
    mockedTransportRequest.mockImplementation(async (params) => {
      if (params.path.includes('/messages?max_results=1000')) {
        return {
          body: {
            messages: [
              {
                input: 'input',
                response: 'response',
              },
            ],
          },
        };
      }

      return {
        body: {
          memory_id: 'conversation_id',
          create_time: 0,
          updated_time: 0,
          name: 'foo',
        },
      };
    });

    expect(await agentFrameworkService.getConversation('_mock')).toMatchInlineSnapshot(`
      Object {
        "createdTimeMs": 0,
        "interactions": Array [
          Object {
            "conversation_id": "",
            "input": "input",
            "interaction_id": "",
            "response": "response",
          },
        ],
        "messages": Array [],
        "title": "foo",
        "updatedTimeMs": 0,
      }
    `);
    expect(mockedTransportRequest.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "method": "GET",
            "path": "/_plugins/_ml/memory/_mock/messages?max_results=1000",
          },
        ],
        Array [
          Object {
            "method": "GET",
            "path": "/_plugins/_ml/memory/_mock",
          },
        ],
      ]
    `);
  });

  it('should encode id when calls getConversation with non-standard params in request payload', async () => {
    mockedTransportRequest.mockResolvedValue({
      body: {
        messages: [],
      },
    });

    await agentFrameworkService.getConversation('../non-standard/id');
    expect(mockedTransportRequest.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "method": "GET",
          "path": "/_plugins/_ml/memory/..%2Fnon-standard%2Fid/messages?max_results=1000",
        },
      ]
    `);
  });

  it('getConversations', async () => {
    mockedTransportRequest.mockImplementation(async (params) => {
      return {
        body: {
          hits: {
            hits: [
              {
                _id: 'foo',
                _source: {
                  name: 'foo',
                  create_time: 1,
                  updated_time: 1,
                },
              },
            ],
            total: 10,
          },
        },
      };
    });

    expect(
      await agentFrameworkService.getConversations({
        sortField: 'createTimeMs',
        searchFields: ['title'],
        search: 'foo',
        page: 1,
        perPage: 10,
      })
    ).toMatchInlineSnapshot(`
      Object {
        "objects": Array [
          Object {
            "createdTimeMs": 978307200000,
            "id": "foo",
            "messages": Array [],
            "title": "foo",
            "updatedTimeMs": 978307200000,
            "version": 1,
          },
        ],
        "total": 10,
      }
    `);
    expect(
      await agentFrameworkService.getConversations({
        sortField: 'updatedTimeMs',
        searchFields: 'title',
        search: 'foo',
        page: 1,
        perPage: 10,
      })
    ).toMatchInlineSnapshot(`
      Object {
        "objects": Array [
          Object {
            "createdTimeMs": 978307200000,
            "id": "foo",
            "messages": Array [],
            "title": "foo",
            "updatedTimeMs": 978307200000,
            "version": 1,
          },
        ],
        "total": 10,
      }
    `);
    expect(mockedTransportRequest.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "body": Object {
              "from": 0,
              "query": Object {
                "bool": Object {
                  "must": Array [
                    Object {
                      "term": Object {
                        "application_type": Object {
                          "value": "chatbot",
                        },
                      },
                    },
                    Object {
                      "multi_match": Object {
                        "fields": Array [
                          "name",
                        ],
                        "query": "foo",
                      },
                    },
                  ],
                },
              },
              "size": 10,
            },
            "method": "GET",
            "path": "/_plugins/_ml/memory/_search",
          },
        ],
        Array [
          Object {
            "body": Object {
              "from": 0,
              "query": Object {
                "bool": Object {
                  "must": Array [
                    Object {
                      "term": Object {
                        "application_type": Object {
                          "value": "chatbot",
                        },
                      },
                    },
                    Object {
                      "multi_match": Object {
                        "fields": Array [
                          "name",
                        ],
                        "query": "foo",
                      },
                    },
                  ],
                },
              },
              "size": 10,
            },
            "method": "GET",
            "path": "/_plugins/_ml/memory/_search",
          },
        ],
      ]
    `);
  });

  it('saveMessages should send error', async () => {
    expect(agentFrameworkService.saveMessages('', '', [])).rejects.toMatchInlineSnapshot(
      `[Error: Method is not needed]`
    );
  });

  it('deleteConversation', async () => {
    mockedTransportRequest.mockImplementationOnce(async (params) => ({
      statusCode: 200,
    }));
    expect(agentFrameworkService.deleteConversation('foo')).resolves.toMatchInlineSnapshot(`
      Object {
        "success": true,
      }
    `);
    mockedTransportRequest.mockImplementationOnce(async (params) => ({
      statusCode: 404,
      body: {
        message: 'can not find conversation',
      },
    }));
    expect(agentFrameworkService.deleteConversation('foo')).resolves.toMatchInlineSnapshot(`
      Object {
        "message": "{\\"message\\":\\"can not find conversation\\"}",
        "statusCode": 404,
        "success": false,
      }
    `);
    mockedTransportRequest.mockImplementationOnce(async (params) => {
      return Promise.reject({ meta: { body: 'error' } });
    });
    expect(agentFrameworkService.deleteConversation('foo')).rejects.toBeDefined();
  });

  it('should encode id when calls deleteConversation with non-standard params in request payload', async () => {
    mockedTransportRequest.mockResolvedValueOnce({
      statusCode: 200,
    });
    await agentFrameworkService.deleteConversation('../non-standard/id');
    expect(mockedTransportRequest.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "method": "DELETE",
          "path": "/_plugins/_ml/memory/..%2Fnon-standard%2Fid",
        },
      ]
    `);
  });

  it('updateConversation', async () => {
    mockedTransportRequest.mockImplementationOnce(async (params) => ({
      statusCode: 200,
    }));
    expect(agentFrameworkService.updateConversation('foo', 'title')).resolves
      .toMatchInlineSnapshot(`
      Object {
        "success": true,
      }
    `);
    mockedTransportRequest.mockImplementationOnce(async (params) => ({
      statusCode: 404,
      body: {
        message: 'can not find conversation',
      },
    }));
    expect(agentFrameworkService.updateConversation('foo', 'title')).resolves
      .toMatchInlineSnapshot(`
      Object {
        "message": "{\\"message\\":\\"can not find conversation\\"}",
        "statusCode": 404,
        "success": false,
      }
    `);
    mockedTransportRequest.mockImplementationOnce(async (params) => {
      return Promise.reject({ meta: { body: 'error' } });
    });
    expect(agentFrameworkService.updateConversation('foo', 'title')).rejects.toBeDefined();
  });

  it('should encode id when calls updateConversation with non-standard params in request payload', async () => {
    mockedTransportRequest.mockResolvedValueOnce({
      statusCode: 200,
    });
    await agentFrameworkService.updateConversation('../non-standard/id', 'title');
    expect(mockedTransportRequest.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "body": Object {
            "name": "title",
          },
          "method": "PUT",
          "path": "/_plugins/_ml/memory/..%2Fnon-standard%2Fid",
        },
      ]
    `);
  });

  it('getTraces', async () => {
    mockedTransportRequest.mockImplementationOnce(async (params) => ({
      body: {
        traces: [
          {
            message_id: 'interaction_id',
            create_time: 'create_time',
            input: 'input',
            response: 'response',
            origin: 'origin',
            trace_number: 1,
          },
        ],
      },
    }));
    expect(agentFrameworkService.getTraces('foo')).resolves.toMatchInlineSnapshot(`
      Array [
        Object {
          "createTime": "create_time",
          "input": "input",
          "interactionId": "interaction_id",
          "origin": "origin",
          "output": "response",
          "traceNumber": 1,
        },
      ]
    `);
    mockedTransportRequest.mockImplementationOnce(async (params) => {
      return Promise.reject({ meta: { body: 'error' } });
    });
    expect(agentFrameworkService.getTraces('foo')).rejects.toMatchInlineSnapshot(`
      Object {
        "meta": Object {
          "body": "error",
        },
      }
    `);
  });

  it('should encode id when calls getTraces with non-standard params in request payload', async () => {
    mockedTransportRequest.mockResolvedValueOnce({
      body: {
        traces: [
          {
            message_id: 'interaction_id',
            create_time: 'create_time',
            input: 'input',
            response: 'response',
            origin: 'origin',
            trace_number: 1,
          },
        ],
      },
    });
    await agentFrameworkService.getTraces('../non-standard/id');
    expect(mockedTransportRequest.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "method": "GET",
          "path": "/_plugins/_ml/memory/message/..%2Fnon-standard%2Fid/traces?max_results=50",
        },
      ]
    `);
  });

  it('updateInteraction', async () => {
    mockedTransportRequest.mockImplementationOnce(async (params) => ({
      statusCode: 200,
    }));
    expect(
      agentFrameworkService.updateInteraction('foo', {
        foo: {
          bar: 'foo',
        },
      })
    ).resolves.toMatchInlineSnapshot(`
      Object {
        "success": true,
      }
    `);
    mockedTransportRequest.mockImplementationOnce(async (params) => ({
      statusCode: 404,
      body: {
        message: 'can not find conversation',
      },
    }));
    expect(
      agentFrameworkService.updateInteraction('foo', {
        foo: {
          bar: 'foo',
        },
      })
    ).resolves.toMatchInlineSnapshot(`
      Object {
        "message": "{\\"message\\":\\"can not find conversation\\"}",
        "statusCode": 404,
        "success": false,
      }
    `);
    mockedTransportRequest.mockImplementationOnce(async (params) => {
      return Promise.reject({ meta: { body: 'error' } });
    });
    expect(
      agentFrameworkService.updateInteraction('foo', {
        foo: {
          bar: 'foo',
        },
      })
    ).rejects.toMatchInlineSnapshot(`
      Object {
        "meta": Object {
          "body": "error",
        },
      }
    `);
  });

  it('should encode id when calls updateInteraction with non-standard params in request payload', async () => {
    mockedTransportRequest.mockResolvedValueOnce({
      statusCode: 200,
    });
    await agentFrameworkService.updateInteraction('../non-standard/id', {
      foo: {
        bar: 'foo',
      },
    });
    expect(mockedTransportRequest.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "body": Object {
            "additional_info": Object {
              "foo": Object {
                "bar": "foo",
              },
            },
          },
          "method": "PUT",
          "path": "/_plugins/_ml/memory/message/..%2Fnon-standard%2Fid",
        },
      ]
    `);
  });

  it('getInteraction', async () => {
    mockedTransportRequest.mockImplementation(async (params) => ({
      body: {
        input: 'input',
        response: 'response',
      },
    }));
    expect(agentFrameworkService.getInteraction('', '')).rejects.toMatchInlineSnapshot(
      `[Error: conversationId is required]`
    );
    expect(agentFrameworkService.getInteraction('_id', '')).rejects.toMatchInlineSnapshot(
      `[Error: interactionId is required]`
    );
    expect(mockedTransportRequest).toBeCalledTimes(0);
    expect(agentFrameworkService.getInteraction('_id', 'interaction_id')).resolves
      .toMatchInlineSnapshot(`
      Object {
        "conversation_id": "",
        "input": "input",
        "interaction_id": "",
        "response": "response",
      }
    `);
    expect(mockedTransportRequest).toBeCalledTimes(1);
  });

  it('should encode id when calls getInteraction with non-standard params in request payload', async () => {
    mockedTransportRequest.mockResolvedValueOnce({
      body: {
        input: 'input',
        response: 'response',
      },
    });
    await agentFrameworkService.getInteraction('_id', '../non-standard/id');
    expect(mockedTransportRequest.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "method": "GET",
          "path": "/_plugins/_ml/memory/message/..%2Fnon-standard%2Fid",
        },
      ]
    `);
  });
});
