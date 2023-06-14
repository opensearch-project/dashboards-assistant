/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DynamicTool } from 'langchain/tools';
import { ILegacyScopedClusterClient, OpenSearchClient } from '../../../../../../src/core/server';

export class PluginToolsFactory {
  opensearchClient?: OpenSearchClient;
  observabilityClient?: ILegacyScopedClusterClient;
  toolsList?: DynamicTool[];

  public constructClients(
    opensearchClient: OpenSearchClient,
    observabilityClient: ILegacyScopedClusterClient
  ) {
    this.opensearchClient = opensearchClient;
    this.observabilityClient = observabilityClient;
  }

  public destructClients() {
    this.opensearchClient = undefined;
    this.observabilityClient = undefined;
  }
}
