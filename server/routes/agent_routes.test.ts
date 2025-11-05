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
import { AGENT_API } from '../../common/constants/llm';
import { AssistantClient } from '../services/assistant_client';
import { RequestHandlerContext } from '../../../../src/core/server';
import { registerAgentRoutes } from './agent_routes';
import { DataSourceEngineType } from '../../../../src/plugins/data_source/common/data_sources';
const mockedLogger = loggerMock.create();

export const createMockedAssistantClient = (
  request: OpenSearchDashboardsRequest
): AssistantClient => {
  return new AssistantClient(request, {} as RequestHandlerContext);
};

const mockedAssistantClient = createMockedAssistantClient({} as OpenSearchDashboardsRequest);

describe('test execute agent route', () => {
  const router = new Router(
    '',
    mockedLogger,
    enhanceWithContext({
      assistant_plugin: {
        logger: mockedLogger,
      },
    })
  );
  registerAgentRoutes(router, {
    getScopedClient: jest.fn(
      (request: OpenSearchDashboardsRequest, context: RequestHandlerContext) => {
        return mockedAssistantClient;
      }
    ),
  });
  const executeAgentRequest = (payload: {}, query: {}) =>
    triggerHandler(router, {
      method: 'post',
      path: AGENT_API.EXECUTE,
      req: httpServerMock.createRawRequest({
        payload: JSON.stringify(payload),
        query,
      }),
    });
  beforeEach(() => {
    loggerMock.clear(mockedLogger);
    resetMocks();
  });

  it('return 4xx when execute agent throws 4xx error', async () => {
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
    const result = (await executeAgentRequest(
      {},
      {
        agentConfigName: 'os_insight',
      }
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

  it('return 4xx when executeAgent throws 4xx error in string format', async () => {
    mockedAssistantClient.executeAgentByConfigName = jest.fn().mockRejectedValue({
      statusCode: 429,
      body: 'Request is throttled at model level',
    });
    const result = (await executeAgentRequest(
      {},
      {
        agentConfigName: 'os_insight',
      }
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

  it('return 5xx when executeAgent throws 5xx error', async () => {
    mockedAssistantClient.executeAgentByConfigName = jest.fn().mockRejectedValue({
      statusCode: 500,
      body: 'Server error',
    });
    const result = (await executeAgentRequest(
      {},
      {
        agentConfigName: 'os_insight',
      }
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
});

describe('test CONFIG_EXISTS route', () => {
  const mockSavedObjectsClient = {
    get: jest.fn(),
  };

  const router = new Router(
    '',
    mockedLogger,
    enhanceWithContext({
      assistant_plugin: {
        logger: mockedLogger,
      },
      core: {
        savedObjects: {
          client: mockSavedObjectsClient,
        },
      },
    })
  );
  registerAgentRoutes(router, {
    getScopedClient: jest.fn(
      (request: OpenSearchDashboardsRequest, context: RequestHandlerContext) => {
        return mockedAssistantClient;
      }
    ),
  });
  const checkAgentExistRequest = (payload: {}, query: {}) =>
    triggerHandler(router, {
      method: 'get',
      path: AGENT_API.CONFIG_EXISTS,
      req: httpServerMock.createRawRequest({
        payload: JSON.stringify(payload),
        query,
      }),
    });
  beforeEach(() => {
    loggerMock.clear(mockedLogger);
    resetMocks();
    mockSavedObjectsClient.get.mockReset();
  });

  it('should detect serverless data source', async () => {
    mockSavedObjectsClient.get.mockResolvedValue({
      attributes: {
        dataSourceEngineType: DataSourceEngineType.OpenSearchServerless,
      },
    });

    const result = await checkAgentExistRequest(
      {},
      {
        dataSourceId: 'test-ds-id',
        agentConfigName: 'os_insight',
      }
    );

    expect(mockSavedObjectsClient.get).toHaveBeenCalledWith('data-source', 'test-ds-id');
    expect(result).toMatchSnapshot();
  });
});
