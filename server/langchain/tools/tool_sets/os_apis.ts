/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DynamicTool } from 'langchain/tools';
import { PluginToolsFactory } from '../tools_factory/tools_factory';

export class OSAPITools extends PluginToolsFactory {
  toolsList = [
    new DynamicTool({
      name: 'Get OpenSearch indices',
      description:
        'use this tool to get high-level information like (health, status, index, uuid, primary count, replica count, docs.count, docs.deleted, store.size, primary.store.size) about indices in a cluster, including backing indices for data streams in the OpenSearch cluster.',
      func: (indexName?: string) => this.cat_indices(indexName),
    }),
    new DynamicTool({
      name: 'OpenSearch Index check',
      description:
        'use this tool to check if a data stream, index, or alias exists in the OpenSearch cluster. This tool takes the index name as input',
      func: (indexName: string) => this.index_exists(indexName),
    }),
  ];

  public async cat_indices(indexName = '') {
    const catResponse = await this.opensearchClient!.cat.indices({
      index: indexName,
    });
    return JSON.stringify(catResponse.body);
  }

  public async index_exists(indexName: string) {
    const indexExistsResponse = await this.opensearchClient!.indices.exists({
      index: indexName,
    });

    return indexExistsResponse.body
      ? 'Index exists in the OpenSearch Cluster'
      : 'One or more specified Index do not exist';
  }
}
