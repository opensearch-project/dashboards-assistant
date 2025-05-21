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
import { TEXT2VIZ_API } from '../../common/constants/llm';
import { AssistantClient } from '../services/assistant_client';
import { RequestHandlerContext } from '../../../../src/core/server';
import { registerText2VizRoutes } from './text2viz_routes';

const mockedLogger = loggerMock.create();

export const createMockedAssistantClient = (
  request: OpenSearchDashboardsRequest
): AssistantClient => {
  return new AssistantClient(request, {} as RequestHandlerContext);
};

const mockedAssistantClient = createMockedAssistantClient({} as OpenSearchDashboardsRequest);

describe('test text2viz route', () => {
  const router = new Router(
    '',
    mockedLogger,
    enhanceWithContext({
      assistant_plugin: {
        logger: mockedLogger,
      },
      core: {
        opensearch: {
          client: {
            asCurrentUser: {
              indices: {
                getMapping: jest.fn().mockResolvedValue({}),
              },
            },
          },
        },
      },
    })
  );
  registerText2VizRoutes(router, {
    getScopedClient: jest.fn(
      (request: OpenSearchDashboardsRequest, context: RequestHandlerContext) => {
        return mockedAssistantClient;
      }
    ),
  });
  const text2vizRequest = (payload: {}, query: {}) =>
    triggerHandler(router, {
      method: 'post',
      path: TEXT2VIZ_API.TEXT2VEGA,
      req: httpServerMock.createRawRequest({
        payload: JSON.stringify(payload),
        query,
      }),
    });
  const text2pplRequest = (payload: {}, query: {}) =>
    triggerHandler(router, {
      method: 'post',
      path: TEXT2VIZ_API.TEXT2PPL,
      req: httpServerMock.createRawRequest({
        payload: JSON.stringify(payload),
        query,
      }),
    });
  const dataInsightsRequest = (payload: {}, query: {}) =>
    triggerHandler(router, {
      method: 'post',
      path: TEXT2VIZ_API.DATA_INSIGHTS,
      req: httpServerMock.createRawRequest({
        payload: JSON.stringify(payload),
        query,
      }),
    });
  beforeEach(() => {
    loggerMock.clear(mockedLogger);
    resetMocks();
  });

  it('return 4xx when execute agent throws 4xx error for text2viz', async () => {
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
    const result = (await text2vizRequest(
      {
        input_question: 'question',
        input_instruction: 'instruction',
        ppl: 'ppl',
        dataSchema: 'mapping',
        sampleData: 'sample',
      },
      {}
    )) as Boom;
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

  it('return 4xx when executeAgent throws 4xx error in string format for text2viz', async () => {
    mockedAssistantClient.executeAgentByConfigName = jest.fn().mockRejectedValue({
      statusCode: 429,
      body: 'Request is throttled at model level',
    });
    const result = (await text2vizRequest(
      {
        input_question: 'question',
        input_instruction: 'instruction',
        ppl: 'ppl',
        dataSchema: 'mapping',
        sampleData: 'sample',
      },
      {}
    )) as Boom;
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

  it('return 5xx when executeAgent throws 5xx error for text2viz', async () => {
    mockedAssistantClient.executeAgentByConfigName = jest.fn().mockRejectedValue({
      statusCode: 500,
      body: 'Server error',
    });
    const result = (await text2vizRequest(
      {
        input_question: 'question',
        input_instruction: 'instruction',
        ppl: 'ppl',
        dataSchema: 'mapping',
        sampleData: 'sample',
      },
      {}
    )) as Boom;
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

  it('return vega-lite schema for single metric visualization', async () => {
    mockedAssistantClient.executeAgentByConfigName = jest.fn().mockResolvedValue({
      body: {
        inference_results: [
          {
            output: [
              {
                result: `<vega-lite>{"$schema": "https://vega.github.io/schema/vega-lite/v5.json","data": {"values": [{"value": 100}]},"mark": "text","encoding": {"text": {"field": "value"}}}</vega-lite>`,
              },
            ],
          },
        ],
      },
    });
    const result = await text2vizRequest(
      {
        input_question: 'Show total sales',
        input_instruction: 'Create a single metric visualization',
        ppl: 'source=sales | stats sum(sales) as total',
        dataSchema: 'mapping',
        sampleData: 'sample',
      },
      {}
    );
    expect(result).toEqual({
      statusCode: 200,
      body: {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        data: { values: [{ value: 100 }] },
        mark: 'text',
        encoding: { text: { field: 'value' } },
        layer: [{ mark: 'text' }, { mark: 'text', encoding: { text: { value: 'total' } } }],
      },
    });
  });

  it('return 4xx when execute agent throws 4xx error for text2ppl', async () => {
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
    const result = (await text2pplRequest(
      {
        index: 'index',
        question: 'question',
      },
      {}
    )) as Boom;
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

  it('return 4xx when executeAgent throws 4xx error in string format for text2ppl', async () => {
    mockedAssistantClient.executeAgentByConfigName = jest.fn().mockRejectedValue({
      statusCode: 429,
      body: 'Request is throttled at model level',
    });
    const result = (await text2pplRequest(
      {
        index: 'index',
        question: 'question',
      },
      {}
    )) as Boom;
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

  it('return 5xx when executeAgent throws 5xx error for text2ppl', async () => {
    mockedAssistantClient.executeAgentByConfigName = jest.fn().mockRejectedValue({
      statusCode: 500,
      body: 'Server error',
    });
    const result = (await text2pplRequest(
      {
        index: 'index',
        question: 'question',
      },
      {}
    )) as Boom;
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

  it('return data insights with valid response', async () => {
    mockedAssistantClient.executeAgentByConfigName = jest.fn().mockResolvedValue({
      body: {
        inference_results: [
          {
            output: [
              {
                result: `<data-dimension>{"metrics": ["sum_sales"], "dimensions": ["region"]}</data-dimension>`,
              },
            ],
          },
        ],
      },
    });
    const result = await dataInsightsRequest(
      {
        dataSchema: 'mapping',
        sampleData: 'sample',
      },
      {}
    );
    expect(result).toEqual({
      statusCode: 200,
      body: {
        metrics: ['sum_sales'],
        dimensions: ['region'],
      },
    });
    expect(mockedLogger.error).not.toHaveBeenCalled();
  });

  it('return 4xx when execute agent throws 4xx error for data insights', async () => {
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
    const result = (await dataInsightsRequest(
      {
        dataSchema: 'mapping',
        sampleData: 'sample',
      },
      {}
    )) as Boom;
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
    expect(mockedLogger.error).toHaveBeenCalledWith('Execute agent failed!', expect.any(Object));
  });

  it('return 5xx when execute agent throws 5xx error for data insights', async () => {
    mockedAssistantClient.executeAgentByConfigName = jest.fn().mockRejectedValue({
      statusCode: 500,
      body: 'Server error',
    });
    const result = (await dataInsightsRequest(
      {
        dataSchema: 'mapping',
        sampleData: 'sample',
      },
      {}
    )) as Boom;
    expect(result.output).toMatchInlineSnapshot(`
      Object {
        "headers": Object {},
        "payload": Object {
          "error": "Internal Server Error",
          "message": "Execute agent failed!",
          "statusCode": 500,
        },
        "statusCode": 500,
      }
    `);
    expect(mockedLogger.error).toHaveBeenCalledWith('Execute agent failed!', expect.any(Object));
  });
});
