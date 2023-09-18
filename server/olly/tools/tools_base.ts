/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseLanguageModel } from 'langchain/base_language';
import { Callbacks } from 'langchain/callbacks';
import { Embeddings } from 'langchain/dist/embeddings/base';
import { DynamicTool } from 'langchain/tools';
import {
  ILegacyScopedClusterClient,
  OpenSearchClient,
  SavedObjectsClientContract,
} from '../../../../../src/core/server';

export abstract class PluginToolsBase {
  public abstract toolsList: DynamicTool[];

  constructor(
    protected model: BaseLanguageModel,
    protected embeddings: Embeddings,
    protected opensearchClient: OpenSearchClient,
    protected observabilityClient: ILegacyScopedClusterClient,
    protected savedObjectsClient: SavedObjectsClientContract,
    protected callbacks: Callbacks
  ) {}
}
