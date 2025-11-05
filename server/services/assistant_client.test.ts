/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AssistantClient } from './assistant_client';
import { DataSourceEngineType } from '../../../../src/plugins/data_source/common/data_sources';
import { OpenSearchDashboardsRequest, RequestHandlerContext } from '../../../../src/core/server';

const mockContext = {
  core: {
    savedObjects: {
      client: {
        get: jest.fn(),
      },
    },
    opensearch: {
      client: {
        asCurrentUser: {
          transport: {
            request: jest.fn(),
          },
        },
      },
    },
  },
};

const mockRequest = { query: {} };

jest.mock('../routes/get_agent', () => ({
  getAgentIdByConfigName: jest.fn().mockResolvedValue('agent-123'),
}));

describe('AssistantClient', () => {
  let client: AssistantClient;

  beforeEach(() => {
    client = new AssistantClient(
      mockRequest as OpenSearchDashboardsRequest,
      (mockContext as unknown) as RequestHandlerContext
    );
    jest.clearAllMocks();
  });

  describe('executeAgentByConfigName', () => {
    it('should use config name directly for serverless datasource', async () => {
      mockContext.core.savedObjects.client.get.mockResolvedValue({
        attributes: {
          dataSourceEngineType: DataSourceEngineType.OpenSearchServerless,
        },
      });

      mockContext.core.opensearch.client.asCurrentUser.transport.request.mockResolvedValue({
        body: { inference_results: [{ output: [{ result: 'test' }] }] },
      });

      await client.executeAgentByConfigName('test-config', { dataSourceId: 'ds-123' });

      expect(mockContext.core.savedObjects.client.get).toHaveBeenCalledWith(
        'data-source',
        'ds-123'
      );
      expect(
        mockContext.core.opensearch.client.asCurrentUser.transport.request
      ).toHaveBeenCalledWith({
        method: 'POST',
        path: '/_plugins/_ml/agents/test-config/_execute',
        body: { parameters: { dataSourceId: 'ds-123' } },
      });
    });

    it('should get agent ID for non-serverless datasource', async () => {
      mockContext.core.savedObjects.client.get.mockResolvedValue({
        attributes: {
          dataSourceEngineType: DataSourceEngineType.OpenSearch,
        },
      });

      mockContext.core.opensearch.client.asCurrentUser.transport.request.mockResolvedValue({
        body: { inference_results: [{ output: [{ result: 'test' }] }] },
      });

      await client.executeAgentByConfigName('test-config', { dataSourceId: 'ds-123' });

      expect(
        mockContext.core.opensearch.client.asCurrentUser.transport.request
      ).toHaveBeenCalledWith({
        method: 'POST',
        path: '/_plugins/_ml/agents/agent-123/_execute',
        body: { parameters: { dataSourceId: 'ds-123' } },
      });
    });
  });
});
