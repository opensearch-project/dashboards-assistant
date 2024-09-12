/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiResponse } from '@opensearch-project/opensearch';

import {
  OpenSearchClient,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../src/core/server';
import { ML_COMMONS_BASE_API } from '../utils/constants';
import { getAgentIdByConfigName } from '../routes/get_agent';

interface AgentExecuteResponse {
  inference_results: Array<{
    output: Array<{ result: string }>;
  }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isDataSourceQuery = (query: any): query is { dataSourceId: string } => {
  if ('dataSourceId' in query && query.dataSourceId) {
    return true;
  }
  return false;
};

export class AssistantClient {
  private client?: OpenSearchClient;

  constructor(
    private request: OpenSearchDashboardsRequest,
    private context: RequestHandlerContext & {
      dataSource?: {
        opensearch: {
          getClient: (dataSourceId: string) => Promise<OpenSearchClient>;
        };
      };
    }
  ) {}

  executeAgent = async (
    agentId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parameters: Record<string, any>
  ): Promise<ApiResponse<AgentExecuteResponse>> => {
    const client = await this.getOpenSearchClient();

    const response = await client.transport.request({
      method: 'POST',
      path: `${ML_COMMONS_BASE_API}/agents/${agentId}/_execute`,
      body: {
        parameters,
      },
    });

    return response as ApiResponse<AgentExecuteResponse>;
  };

  executeAgentByConfigName = async (
    agentConfigName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parameters: Record<string, any>
  ) => {
    const agentId = await this.getAgentIdByConfigName(agentConfigName);
    return this.executeAgent(agentId, parameters);
  };

  getAgentIdByConfigName = async (agentConfigName: string) => {
    const client = await this.getOpenSearchClient();
    const agentId = await getAgentIdByConfigName(agentConfigName, client.transport);
    return agentId;
  };

  private async getOpenSearchClient() {
    if (!this.client) {
      let client = this.context.core.opensearch.client.asCurrentUser;
      if (isDataSourceQuery(this.request.query) && this.context.dataSource) {
        client = await this.context.dataSource.opensearch.getClient(
          this.request.query.dataSourceId
        );
      }
      this.client = client;
    }

    return this.client;
  }
}
