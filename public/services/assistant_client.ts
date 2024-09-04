/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { API_BASE } from '../../common/constants/llm';
import { HttpSetup } from '../../../../src/core/public';

interface Options {
  dataSourceId?: string;
}

export class AssistantClient {
  constructor(private http: HttpSetup) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executeAgent = (agentId: string, parameters: Record<string, any>, options?: Options) => {
    return this.http.fetch({
      method: 'POST',
      path: `${API_BASE}/agent/_execute`,
      body: JSON.stringify(parameters),
      query: { dataSourceId: options?.dataSourceId, agentId },
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executeAgentByName = (agentName: string, parameters: Record<string, any>, options?: Options) => {
    return this.http.fetch({
      method: 'POST',
      path: `${API_BASE}/agent/_execute`,
      body: JSON.stringify(parameters),
      query: { dataSourceId: options?.dataSourceId, agentName },
    });
  };
}
