/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DynamicTool } from 'langchain/tools';
import { ILegacyScopedClusterClient, OpenSearchClient } from '../../../../../../src/core/server';

export abstract class PluginToolsFactory {
  opensearchClient: OpenSearchClient;
  observabilityClient: ILegacyScopedClusterClient;
  abstract toolsList: DynamicTool[];

  constructor(opensearchClient: OpenSearchClient, observabilityClient: ILegacyScopedClusterClient) {
    this.opensearchClient = opensearchClient;
    this.observabilityClient = observabilityClient;
  }
}
