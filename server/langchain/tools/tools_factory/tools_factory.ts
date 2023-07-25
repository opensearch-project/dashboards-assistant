/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseLanguageModel } from 'langchain/base_language';
import { Embeddings } from 'langchain/dist/embeddings/base';
import { DynamicTool } from 'langchain/tools';
import { ILegacyScopedClusterClient, OpenSearchClient } from '../../../../../../src/core/server';

export abstract class PluginToolsFactory {
  public abstract toolsList: DynamicTool[];

  constructor(
    protected model: BaseLanguageModel,
    protected embeddings: Embeddings,
    protected opensearchClient: OpenSearchClient,
    protected observabilityClient: ILegacyScopedClusterClient
  ) {}
}
