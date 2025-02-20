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
import { postProcessing } from './summary_routes';

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

  describe('postprocessing', () => {
    it('returns combined summarization and final insights when all tags exist', () => {
      const input = `
        Some text <summarization>This is the summary   </summarization> 
        random info <final insights>   These are the insights  </final insights>
        extra text
      `;
      const output = postProcessing(input);

      expect(output).toEqual(`This is the summary\nThese are the insights`);
    });

    it('returns original output if <summarization> tag is missing', () => {
      const input = `Hello world <final insights>Insights here</final insights>`;
      const output = postProcessing(input);
      expect(output).toEqual(input);
    });

    it('returns original output if </summarization> closing tag is missing', () => {
      const input = `<summarization>Partial Summarization <final insights>Insights</final insights>`;
      const output = postProcessing(input);
      expect(output).toEqual(input);
    });

    it('returns original output if <final insights> or </final insights> tags are missing', () => {
      const input = `<summarization>Summary only</summarization>`;
      const output = postProcessing(input);
      expect(output).toEqual(input);
    });

    it('handles empty summarization or empty insights gracefully', () => {
      const inputWithEmptySummary = `<summarization></summarization><final insights>Some insights</final insights>`;
      const outputWithEmptySummary = postProcessing(inputWithEmptySummary);
      expect(outputWithEmptySummary).toEqual(`\nSome insights`);

      const inputWithEmptyInsights = `<summarization>Some summary</summarization><final insights></final insights>`;
      const outputWithEmptyInsights = postProcessing(inputWithEmptyInsights);
      expect(outputWithEmptyInsights).toEqual(`Some summary\n`);
    });

    it('returns original output if none of the special tags are found', () => {
      const input = `Just a normal string without any special tags.`;
      const output = postProcessing(input);
      expect(output).toEqual(input);
    });

    it('handles malformed or mixed case tags by returning the original string', () => {
      const input = `<Summarization>Summary</summarization><FINAL INSIGHTS>Insights</final insights>`;
      const output = postProcessing(input);
      expect(output).toEqual(input);
    });

    it('handles special characters in content', () => {
      const input = `<summarization>Summary with <>&"'</summarization><final insights>Insights with <>& "'</final insights>`;
      const output = postProcessing(input);
      expect(output).toEqual(`Summary with <>&"'\nInsights with <>& "'`);
    });

    it('handles unicode characters correctly', () => {
      const input = `<summarization>Summary with emoji 😊</summarization><final insights>Insights with unicode 你好</final insights>`;
      const output = postProcessing(input);
      expect(output).toEqual(`Summary with emoji 😊\nInsights with unicode 你好`);
    });

    it('handles invisible characters', () => {
      const input = `<summarization>Sum\u200Bmary</summarization><final insights>In\u200Bsights</final insights>`;
      const output = postProcessing(input);
      expect(output).toEqual(`Sum\u200Bmary\nIn\u200Bsights`);
    });
  });
});
