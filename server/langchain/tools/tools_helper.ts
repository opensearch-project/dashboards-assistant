/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ILegacyScopedClusterClient, OpenSearchClient } from '../../../../../src/core/server';
import { PluginTools } from './tools_factory/tools_factory';

export const constructTools = (
  opensearchClient: OpenSearchClient,
  observabilityClient: ILegacyScopedClusterClient,
  toolObjects: PluginTools[]
) => {
  toolObjects.forEach((toolObject) =>
    toolObject.constructClients(opensearchClient, observabilityClient)
  );
};

export const destructTools = (toolObjects: PluginTools[]) => {
  toolObjects.forEach((toolObject) => toolObject.destructClients());
};
