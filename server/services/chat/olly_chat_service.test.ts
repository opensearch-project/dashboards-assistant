/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OllyChatService } from './olly_chat_service';
import { CoreRouteHandlerContext } from '../../../../../src/core/server/core_route_handler_context';
import { coreMock, httpServerMock } from '../../../../../src/core/server/mocks';
import { TransportRequestParams } from '@opensearch-project/opensearch/lib/Transport';

describe('OllyChatService', () => {
  const coreContext = new CoreRouteHandlerContext(
    coreMock.createInternalStart(),
    httpServerMock.createOpenSearchDashboardsRequest()
  );
  const mockedTransport = coreContext.opensearch.client.asCurrentUser.transport;
  const mockedTransportRequest = mockedTransport.request as jest.Mock;

  const ollyChatService: OllyChatService = new OllyChatService(mockedTransport);

  const alertAgentRes = {
    body: {
      type: 'os_chat_root_agent',
      ml_configuration: {
        agent_id: 'alert_analysis_agent_id',
      },
    },
  };

  const rootAgentRes = {
    body: {
      type: 'os_chat_root_agent',
      configuration: {
        agent_id: '4qJKOo0BT01kB_DHroJv',
      },
    },
  };

  const inferenceResult = {
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

  beforeEach(async () => {
    mockedTransportRequest.mockClear();
  });

  it('requestLLM should invoke client call with correct params', async () => {
    mockedTransportRequest.mockImplementation((args) => {
      if (args.path === '/_plugins/_ml/config/os_chat') {
        return rootAgentRes;
      } else if (args.path === '/_plugins/_ml/memory/conversationId') {
        return {
          body: {
            memory_id: 'conversationId',
            create_time: '2024-08-19T10:42:13.783016Z',
            updated_time: '2024-08-19T10:44:36.973918Z',
            name: 'test conversation',
            additional_info: {},
          },
        };
      } else {
        return inferenceResult;
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
    expect(mockedTransportRequest.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "method": "GET",
            "path": "/_plugins/_ml/memory/conversationId",
          },
        ],
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
                "agentRole": undefined,
                "context": undefined,
                "index": undefined,
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

  it('requestLLM should invoke client call with correct params with agent role been set', async () => {
    mockedTransportRequest.mockImplementation((args) => {
      if (args.path === '/_plugins/_ml/config/alert_analysis') {
        return alertAgentRes;
      } else if (args.path === '/_plugins/_ml/memory/conversationId') {
        return {
          body: {
            memory_id: 'conversationId',
            create_time: '2024-08-19T10:42:13.783016Z',
            updated_time: '2024-08-19T10:44:36.973918Z',
            name: 'test conversation',
            additional_info: {
              agentRole: 'alerts',
            },
          },
        };
      } else {
        return inferenceResult;
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
    expect(mockedTransportRequest.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "method": "GET",
            "path": "/_plugins/_ml/memory/conversationId",
          },
        ],
        Array [
          Object {
            "method": "GET",
            "path": "/_plugins/_ml/config/alert_analysis",
          },
        ],
        Array [
          Object {
            "body": Object {
              "parameters": Object {
                "agentRole": "alerts",
                "context": undefined,
                "index": undefined,
                "memory_id": "conversationId",
                "prompt.prefix": "Assistant is an advanced alert summarization and analysis agent.For each alert, we will provide a comprehensive detail of the alert, including relevant information. Here is the detail of alert \${parameters.context}",
                "question": "content",
                "verbose": false,
              },
            },
            "method": "POST",
            "path": "/_plugins/_ml/agents/alert_analysis_agent_id/_execute",
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

  it('requestLLM should invoke client call with correct params for new conversation', async () => {
    mockedTransportRequest.mockImplementation((args) => {
      if (args.path === '/_plugins/_ml/config/os_chat') {
        return rootAgentRes;
      } else {
        return inferenceResult;
      }
    });
    const result = await ollyChatService.requestLLM({
      messages: [],
      input: {
        type: 'input',
        contentType: 'text',
        content: 'content',
      },
    });
    expect(mockedTransportRequest.mock.calls).toMatchInlineSnapshot(`
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
                "agentRole": undefined,
                "context": undefined,
                "index": undefined,
                "memory_id": undefined,
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

  it('requestLLM should invoke client call with correct params for new conversation with agent role', async () => {
    mockedTransportRequest.mockImplementation((args) => {
      if (args.path === '/_plugins/_ml/config/alert_analysis') {
        return alertAgentRes;
      } else if (args.path === '/_plugins/_ml/memory' && args.method === 'POST') {
        return {
          body: {
            memory_id: '2qjZaZEBYcKe8A3Pyut4',
          },
        };
      } else {
        return inferenceResult;
      }
    });
    const result = await ollyChatService.requestLLM({
      messages: [],
      input: {
        type: 'input',
        contentType: 'text',
        content: 'content',
        context: {
          agentRole: 'alerts',
        },
      },
    });
    expect(mockedTransportRequest.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "method": "GET",
            "path": "/_plugins/_ml/config/alert_analysis",
          },
        ],
        Array [
          Object {
            "method": "GET",
            "path": "/_plugins/_ml/agents/alert_analysis_agent_id",
          },
        ],
        Array [
          Object {
            "body": Object {
              "additional_info": Object {
                "agentRole": "alerts",
                "agent_config_id": "alert_analysis",
              },
              "application_type": undefined,
              "name": "content",
            },
            "method": "POST",
            "path": "/_plugins/_ml/memory",
          },
        ],
        Array [
          Object {
            "body": Object {
              "parameters": Object {
                "agentRole": "alerts",
                "context": undefined,
                "index": undefined,
                "memory_id": "2qjZaZEBYcKe8A3Pyut4",
                "prompt.prefix": "Assistant is an advanced alert summarization and analysis agent.For each alert, we will provide a comprehensive detail of the alert, including relevant information. Here is the detail of alert \${parameters.context}",
                "question": "content",
                "verbose": false,
              },
            },
            "method": "POST",
            "path": "/_plugins/_ml/agents/alert_analysis_agent_id/_execute",
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
    mockedTransportRequest.mockImplementation((args) => {
      if (args.path === '/_plugins/_ml/config/os_chat') {
        throw new Error('error');
      }
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
    ).rejects.toMatchInlineSnapshot(`[Error: get agent os_chat failed, reason: Error: error]`);
  });

  it('regenerate should invoke client call with correct params', async () => {
    mockedTransportRequest.mockImplementation((args) => {
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
    expect(mockedTransportRequest.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "method": "GET",
            "path": "/_plugins/_ml/memory/conversationId",
          },
        ],
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
    mockedTransportRequest.mockImplementation((args) => {
      if (args.path === '/_plugins/_ml/config/os_chat') {
        throw new Error('error');
      }
    });
    expect(
      ollyChatService.regenerate({
        conversationId: 'conversationId',
        interactionId: 'interactionId',
      })
    ).rejects.toMatchInlineSnapshot(`[Error: get agent os_chat failed, reason: Error: error]`);
  });

  it('fetching root agent id throws error', async () => {
    mockedTransportRequest.mockImplementation((args: TransportRequestParams) => {
      if (args.path === '/_plugins/_ml/config/os_chat') {
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
    expect(
      ollyChatService.regenerate({
        conversationId: 'conversationId',
        interactionId: 'interactionId',
      })
    ).rejects.toMatchInlineSnapshot(
      `[Error: get agent os_chat failed, reason: Error: cannot get agent os_chat by calling the api: /_plugins/_ml/config/os_chat]`
    );
  });
});
