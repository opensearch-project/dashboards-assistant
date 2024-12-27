/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Boom } from '@hapi/boom';
import { OpenSearchDashboardsRequest, Router } from '../../../../src/core/server/http/router';
import { enhanceWithContext, triggerHandler } from './router.mock';
import { resetMocks } from '../services/storage/agent_framework_storage_service.mock';
import { httpServerMock } from '../../../../src/core/server/http/http_server.mocks';
import { loggerMock } from '../../../../src/core/server/logging/logger.mock';
import { SUMMARY_ASSISTANT_API } from '../../common/constants/llm';
import { registerData2SummaryRoutes, registerSummaryAssistantRoutes } from './summary_routes';
import { AssistantClient } from '../services/assistant_client';
import { RequestHandlerContext } from '../../../../src/core/server';
import * as AgentHelpers from './get_agent';
const mockedLogger = loggerMock.create();

export const createMockedAssistantClient = (
  request: OpenSearchDashboardsRequest
): AssistantClient => {
  return new AssistantClient(request, {} as RequestHandlerContext);
};

const mockedAssistantClient = createMockedAssistantClient({} as OpenSearchDashboardsRequest);

describe('test summary route', () => {
  const router = new Router(
    '',
    mockedLogger,
    enhanceWithContext({
      assistant_plugin: {
        logger: mockedLogger,
      },
    })
  );
  registerSummaryAssistantRoutes(router, {
    getScopedClient: jest.fn(
      (request: OpenSearchDashboardsRequest, context: RequestHandlerContext) => {
        return mockedAssistantClient;
      }
    ),
  });
  registerData2SummaryRoutes(router, {
    getScopedClient: jest.fn(
      (request: OpenSearchDashboardsRequest, context: RequestHandlerContext) => {
        return mockedAssistantClient;
      }
    ),
  });
  const summaryRequest = (payload: {}) =>
    triggerHandler(router, {
      method: 'post',
      path: SUMMARY_ASSISTANT_API.SUMMARIZE,
      req: httpServerMock.createRawRequest({
        payload: JSON.stringify(payload),
      }),
    });
  const insightRequest = (payload: {}) =>
    triggerHandler(router, {
      method: 'post',
      path: SUMMARY_ASSISTANT_API.INSIGHT,
      req: httpServerMock.createRawRequest({
        payload: JSON.stringify(payload),
      }),
    });
  const dataToSummaryRequest = (payload: {}) =>
    triggerHandler(router, {
      method: 'post',
      path: SUMMARY_ASSISTANT_API.DATA2SUMMARY,
      req: httpServerMock.createRawRequest({
        payload: JSON.stringify(payload),
      }),
    });
  beforeEach(() => {
    loggerMock.clear(mockedLogger);
    resetMocks();
  });

  it('return 4xx when execute agent throws 4xx error for summary API', async () => {
    mockedAssistantClient.executeAgentByConfigName = jest.fn().mockRejectedValue({
      statusCode: 429,
      body: {
        status: 429,
        error: {
          type: 'OpenSearchStatusException',
          reason: 'System Error',
          details: 'Request is throttled at model level.',
        },
      },
    });
    const result = (await summaryRequest({
      summaryType: 'alerts',
      insightType: 'user_insight',
      question: 'Please summarize this alert, do not use any tool.',
      context: 'context',
    })) as Boom;
    expect(result.output).toMatchInlineSnapshot(`
      Object {
        "headers": Object {},
        "payload": Object {
          "error": "Too Many Requests",
          "message": "{\\"status\\":429,\\"error\\":{\\"type\\":\\"OpenSearchStatusException\\",\\"reason\\":\\"System Error\\",\\"details\\":\\"Request is throttled at model level.\\"}}",
          "statusCode": 429,
        },
        "statusCode": 429,
      }
    `);
  });

  it('return 4xx when executeAgent throws 4xx error in string format for summary API', async () => {
    mockedAssistantClient.executeAgentByConfigName = jest.fn().mockRejectedValue({
      statusCode: 429,
      body: 'Request is throttled at model level',
    });
    const result = (await summaryRequest({
      summaryType: 'alerts',
      insightType: 'user_insight',
      question: 'Please summarize this alert, do not use any tool.',
      context: 'context',
    })) as Boom;
    expect(result.output).toMatchInlineSnapshot(`
      Object {
        "headers": Object {},
        "payload": Object {
          "error": "Too Many Requests",
          "message": "Request is throttled at model level",
          "statusCode": 429,
        },
        "statusCode": 429,
      }
    `);
  });

  it('return 5xx when executeAgent throws 5xx error for summary API', async () => {
    mockedAssistantClient.executeAgentByConfigName = jest.fn().mockRejectedValue({
      statusCode: 500,
      body: 'Server error',
    });
    const result = (await summaryRequest({
      summaryType: 'alerts',
      insightType: 'user_insight',
      question: 'Please summarize this alert, do not use any tool.',
      context: 'context',
    })) as Boom;
    expect(result.output).toMatchInlineSnapshot(`
      Object {
        "headers": Object {},
        "payload": Object {
          "error": "Internal Server Error",
          "message": "An internal server error occurred.",
          "statusCode": 500,
        },
        "statusCode": 500,
      }
    `);
  });

  it('return 4xx when execute agent throws 4xx error for insight API', async () => {
    mockedAssistantClient.executeAgent = jest.fn().mockRejectedValue({
      statusCode: 429,
      body: {
        status: 429,
        error: {
          type: 'OpenSearchStatusException',
          reason: 'System Error',
          details: 'Request is throttled at model level.',
        },
      },
    });
    const spy = jest.spyOn(AgentHelpers, 'getAgentIdByConfigName').mockResolvedValue('test_agent');
    const result = (await insightRequest({
      summaryType: 'alerts',
      insightType: 'os_insight',
      summary: 'summary',
      question: 'Please summarize this alert, do not use any tool.',
      context: 'context',
    })) as Boom;
    expect(result.output).toMatchInlineSnapshot(`
      Object {
        "headers": Object {},
        "payload": Object {
          "error": "Too Many Requests",
          "message": "{\\"status\\":429,\\"error\\":{\\"type\\":\\"OpenSearchStatusException\\",\\"reason\\":\\"System Error\\",\\"details\\":\\"Request is throttled at model level.\\"}}",
          "statusCode": 429,
        },
        "statusCode": 429,
      }
    `);
    spy.mockRestore();
  });

  it('return 4xx when executeAgent throws 4xx error in string format for insight API', async () => {
    mockedAssistantClient.executeAgent = jest.fn().mockRejectedValue({
      statusCode: 429,
      body: 'Request is throttled at model level',
    });
    const spy = jest.spyOn(AgentHelpers, 'getAgentIdByConfigName').mockResolvedValue('test_agent');
    const result = (await insightRequest({
      summaryType: 'alerts',
      insightType: 'os_insight',
      summary: 'summary',
      question: 'Please summarize this alert, do not use any tool.',
      context: 'context',
    })) as Boom;
    expect(result.output).toMatchInlineSnapshot(`
      Object {
        "headers": Object {},
        "payload": Object {
          "error": "Too Many Requests",
          "message": "Request is throttled at model level",
          "statusCode": 429,
        },
        "statusCode": 429,
      }
    `);
    spy.mockRestore();
  });

  it('return 5xx when executeAgent throws 5xx for insight API', async () => {
    mockedAssistantClient.executeAgent = jest.fn().mockRejectedValue({
      statusCode: 500,
      body: 'Server error',
    });
    const spy = jest.spyOn(AgentHelpers, 'getAgentIdByConfigName').mockResolvedValue('test_agent');
    const result = (await insightRequest({
      summaryType: 'alerts',
      insightType: 'os_insight',
      summary: 'summary',
      question: 'Please summarize this alert, do not use any tool.',
      context: 'context',
    })) as Boom;
    expect(result.output).toMatchInlineSnapshot(`
      Object {
        "headers": Object {},
        "payload": Object {
          "error": "Internal Server Error",
          "message": "An internal server error occurred.",
          "statusCode": 500,
        },
        "statusCode": 500,
      }
    `);
    spy.mockRestore();
  });

  it('return 4xx when execute agent throws 4xx error for data2Summary API', async () => {
    mockedAssistantClient.executeAgentByConfigName = jest.fn().mockRejectedValue({
      statusCode: 429,
      body: {
        status: 429,
        error: {
          type: 'OpenSearchStatusException',
          reason: 'System Error',
          details: 'Request is throttled at model level.',
        },
      },
    });

    const result = (await dataToSummaryRequest({
      sample_data: '223.87.60.27 - - [2018-07-22T00:39:02.912Z',
      sample_count: 1,
      total_count: 1,
      question: 'Are there any errors in my logs?',
      ppl: 'source=opensearch_dashboards_sample_data_logs| head 1',
    })) as Boom;
    expect(result.output).toMatchInlineSnapshot(`
      Object {
        "headers": Object {},
        "payload": Object {
          "error": "Too Many Requests",
          "message": "{\\"status\\":429,\\"error\\":{\\"type\\":\\"OpenSearchStatusException\\",\\"reason\\":\\"System Error\\",\\"details\\":\\"Request is throttled at model level.\\"}}",
          "statusCode": 429,
        },
        "statusCode": 429,
      }
    `);
  });

  it('return 4xx when executeAgent throws 4xx error in string format for data2Summary API', async () => {
    mockedAssistantClient.executeAgentByConfigName = jest.fn().mockRejectedValue({
      statusCode: 429,
      body: 'Request is throttled at model level',
    });
    const result = (await dataToSummaryRequest({
      sample_data: '223.87.60.27 - - [2018-07-22T00:39:02.912Z',
      sample_count: 1,
      total_count: 1,
      question: 'Are there any errors in my logs?',
      ppl: 'source=opensearch_dashboards_sample_data_logs| head 1',
    })) as Boom;
    expect(result.output).toMatchInlineSnapshot(`
      Object {
        "headers": Object {},
        "payload": Object {
          "error": "Too Many Requests",
          "message": "Request is throttled at model level",
          "statusCode": 429,
        },
        "statusCode": 429,
      }
    `);
  });

  it('return 5xx when executeAgent throws 5xx error for data2Summary API', async () => {
    mockedAssistantClient.executeAgentByConfigName = jest.fn().mockRejectedValue({
      statusCode: 500,
      body: 'Server error',
    });
    const result = (await dataToSummaryRequest({
      sample_data: '223.87.60.27 - - [2018-07-22T00:39:02.912Z',
      sample_count: 1,
      total_count: 1,
      question: 'Are there any errors in my logs?',
      ppl: 'source=opensearch_dashboards_sample_data_logs| head 1',
    })) as Boom;
    expect(result.output).toMatchInlineSnapshot(`
      Object {
        "headers": Object {},
        "payload": Object {
          "error": "Internal Server Error",
          "message": "An internal server error occurred.",
          "statusCode": 500,
        },
        "statusCode": 500,
      }
    `);
  });
});
