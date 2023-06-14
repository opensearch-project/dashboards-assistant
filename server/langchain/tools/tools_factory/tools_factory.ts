/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tool } from 'langchain/tools';
import { ILegacyScopedClusterClient, OpenSearchClient } from '../../../../../../src/core/server';

export class PluginTools {
  opensearchClient?: OpenSearchClient;
  observabilityClient?: ILegacyScopedClusterClient;
  toolsList?: Tool[];

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
