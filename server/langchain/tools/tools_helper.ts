/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ILegacyScopedClusterClient, OpenSearchClient } from '../../../../../src/core/server';
import { PluginToolsFactory } from './tools_factory/tools_factory';
import { OSAlertingTools } from './tool_sets/aleritng_apis';
import { KnowledgeTools } from './tool_sets/knowledges';
import { OSAPITools } from './tool_sets/os_apis';
import { PPLTools } from './tool_sets/ppl';
import { QueryTools } from './tool_sets/query';

export const initTools = (
  opensearchClient: OpenSearchClient,
  observabilityClient: ILegacyScopedClusterClient
): PluginToolsFactory[] => {
  const pplTools = new PPLTools(opensearchClient, observabilityClient);
  const queryTools = new QueryTools(opensearchClient, observabilityClient);
  const alertingTools = new OSAlertingTools(opensearchClient, observabilityClient);
  const knowledgeTools = new KnowledgeTools(opensearchClient, observabilityClient);
  const opensearchTools = new OSAPITools(opensearchClient, observabilityClient);
  return [pplTools, queryTools, alertingTools, knowledgeTools, opensearchTools];
};
