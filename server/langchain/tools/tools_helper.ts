/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ILegacyScopedClusterClient, OpenSearchClient } from '../../../../../src/core/server';
import { OSAlertingTools } from './tool_sets/aleritng_apis';
import { KnowledgeTools } from './tool_sets/knowledges';
import { OSAPITools } from './tool_sets/os_apis';
import { PPLTools } from './tool_sets/ppl';
import { PluginToolsFactory } from './tools_factory/tools_factory';

export const initTools = (): PluginToolsFactory[] => {
  const pplTools = new PPLTools();
  const alertingTools = new OSAlertingTools();
  const knowledgeTools = new KnowledgeTools();
  const opensearchTools = new OSAPITools();
  return [pplTools, alertingTools, knowledgeTools, opensearchTools];
};

export const constructToolClients = (
  opensearchClient: OpenSearchClient,
  observabilityClient: ILegacyScopedClusterClient,
  toolObjects: PluginToolsFactory[]
) => {
  toolObjects.forEach((toolObject) =>
    toolObject.constructClients(opensearchClient, observabilityClient)
  );
};

export const destructToolsClients = (toolObjects: PluginToolsFactory[]) => {
  toolObjects.forEach((toolObject) => toolObject.destructClients());
};
