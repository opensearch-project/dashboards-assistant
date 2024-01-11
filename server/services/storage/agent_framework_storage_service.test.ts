/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentFrameworkStorageService } from './agent_framework_storage_service';
import { CoreRouteHandlerContext } from '../../../../../src/core/server/core_route_handler_context';
import { coreMock, httpServerMock } from '../../../../../src/core/server/mocks';
import { loggerMock } from '../../../../../src/core/server/logging/logger.mock';

describe('AgentFrameworkStorageService', () => {
  const coreContext = new CoreRouteHandlerContext(
    coreMock.createInternalStart(),
    httpServerMock.createOpenSearchDashboardsRequest()
  );
  const mockedTransport = coreContext.opensearch.client.asCurrentUser.transport
    .request as jest.Mock;
  const agentFrameworkService = new AgentFrameworkStorageService(
    coreContext.opensearch.client.asCurrentUser,
    []
  );
  beforeEach(() => {
    mockedTransport.mockReset();
  });
  it('getConversation', async () => {
    mockedTransport.mockImplementation(async (params) => {
      if (params.path.includes('/_list?max_results=1000')) {
        return {
          body: {
            interactions: [
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
          conversation_id: 'conversation_id',
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
            "input": "input",
            "response": "response",
          },
        ],
        "messages": Array [],
        "title": "foo",
        "updatedTimeMs": 0,
      }
    `);
    expect(mockedTransport.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "method": "GET",
            "path": "/_plugins/_ml/memory/conversation/_mock/_list?max_results=1000",
          },
        ],
        Array [
          Object {
            "method": "GET",
            "path": "/_plugins/_ml/memory/conversation/_mock",
          },
        ],
      ]
    `);
  });

  it('getConversations', async () => {
    mockedTransport.mockImplementation(async (params) => {
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
    expect(mockedTransport.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "body": Object {
              "from": 0,
              "query": Object {
                "multi_match": Object {
                  "fields": Array [
                    "name",
                  ],
                  "query": "foo",
                },
              },
              "size": 10,
            },
            "method": "GET",
            "path": "/_plugins/_ml/memory/conversation/_search",
          },
        ],
        Array [
          Object {
            "body": Object {
              "from": 0,
              "query": Object {
                "multi_match": Object {
                  "fields": Array [
                    "name",
                  ],
                  "query": "foo",
                },
              },
              "size": 10,
            },
            "method": "GET",
            "path": "/_plugins/_ml/memory/conversation/_search",
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
    mockedTransport.mockImplementationOnce(async (params) => ({
      statusCode: 200,
    }));
    expect(agentFrameworkService.deleteConversation('foo')).resolves.toMatchInlineSnapshot(`
      Object {
        "success": true,
      }
    `);
    mockedTransport.mockImplementationOnce(async (params) => ({
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
    mockedTransport.mockImplementationOnce(async (params) => {
      return Promise.reject({ meta: { body: 'error' } });
    });
    expect(agentFrameworkService.deleteConversation('foo')).rejects.toBeDefined();
  });

  it('updateConversation', async () => {
    mockedTransport.mockImplementationOnce(async (params) => ({
      statusCode: 200,
    }));
    expect(agentFrameworkService.updateConversation('foo', 'title')).resolves
      .toMatchInlineSnapshot(`
      Object {
        "success": true,
      }
    `);
    mockedTransport.mockImplementationOnce(async (params) => ({
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
    mockedTransport.mockImplementationOnce(async (params) => {
      return Promise.reject({ meta: { body: 'error' } });
    });
    expect(agentFrameworkService.updateConversation('foo', 'title')).rejects.toBeDefined();
  });

  it('getTraces', async () => {
    mockedTransport.mockImplementationOnce(async (params) => ({
      body: {
        traces: [
          {
            conversation_id: 'conversation_id',
            interaction_id: 'interaction_id',
            create_time: 'create_time',
            input: 'input',
            response: 'response',
            origin: 'origin',
            parent_interaction_id: 'parent_interaction_id',
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
          "parentInteractionId": "parent_interaction_id",
          "traceNumber": 1,
        },
      ]
    `);
    mockedTransport.mockImplementationOnce(async (params) => {
      return Promise.reject({ meta: { body: 'error' } });
    });
    expect(agentFrameworkService.getTraces('foo')).rejects.toMatchInlineSnapshot(
      `[Error: get traces failed, reason:"error"]`
    );
  });

  it('updateInteraction', async () => {
    mockedTransport.mockImplementationOnce(async (params) => ({
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
    mockedTransport.mockImplementationOnce(async (params) => ({
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
    mockedTransport.mockImplementationOnce(async (params) => {
      return Promise.reject({ meta: { body: 'error' } });
    });
    expect(
      agentFrameworkService.updateInteraction('foo', {
        foo: {
          bar: 'foo',
        },
      })
    ).rejects.toMatchInlineSnapshot(`[Error: update interaction failed, reason:"error"]`);
  });

  it('getInteraction', async () => {
    mockedTransport.mockImplementation(async (params) => ({
      body: {
        input: 'input',
        response: 'response',
      },
    }));
    expect(agentFrameworkService.getInteraction('', '')).rejects.toMatchInlineSnapshot(
      `[Error: Id is required]`
    );
    expect(agentFrameworkService.getInteraction('_id', '')).rejects.toMatchInlineSnapshot(
      `[Error: interactionId is required]`
    );
    expect(mockedTransport).toBeCalledTimes(0);
    expect(agentFrameworkService.getInteraction('_id', 'interaction_id')).resolves
      .toMatchInlineSnapshot(`
      Object {
        "input": "input",
        "response": "response",
      }
    `);
    expect(mockedTransport).toBeCalledTimes(1);
  });
});
