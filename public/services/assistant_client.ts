/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AGENT_API } from '../../common/constants/llm';
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
      path: AGENT_API.EXECUTE,
      body: JSON.stringify(parameters),
      query: { dataSourceId: options?.dataSourceId, agentId },
    });
  };

  executeAgentByConfigName = (
    agentConfigName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parameters: Record<string, any>,
    options?: Options
  ) => {
    return this.http.fetch({
      method: 'POST',
      path: AGENT_API.EXECUTE,
      body: JSON.stringify(parameters),
      query: { dataSourceId: options?.dataSourceId, agentConfigName },
    });
  };

  /**
   * Return if the given agent config name has agent id configured
   */
  agentConfigExists = (agentConfigName: string, options?: Options) => {
    return this.http.fetch<{ exists: boolean }>({
      method: 'GET',
      path: AGENT_API.CONFIG_EXISTS,
      query: { dataSourceId: options?.dataSourceId, agentConfigName },
    });
  };
}
