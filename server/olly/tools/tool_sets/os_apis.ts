/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DynamicTool } from 'langchain/tools';
import { jsonToCsv, protectCall } from '../../utils/utils';
import { PluginToolsBase } from '../tools_base';

export class OSAPITools extends PluginToolsBase {
  toolsList = [
    new DynamicTool({
      name: 'Get OpenSearch indices',
      description:
        'use this tool to get high-level information like (health, status, index, uuid, primary count, replica count, docs.count, docs.deleted, store.size, primary.store.size) about indices in a cluster, including backing indices for data streams in the OpenSearch cluster. This tool optionally takes the index name as input',
      func: protectCall((indexName?: string) => this.catIndices(indexName)),
      callbacks: this.callbacks,
    }),
    new DynamicTool({
      name: 'Check OpenSearch index existence',
      description:
        'use this tool to check if a data stream, index, or alias exists in the OpenSearch cluster. This tool takes the index name as input',
      func: protectCall((indexName: string) => this.indexExists(indexName)),
      callbacks: this.callbacks,
    }),
  ];

  public async catIndices(indexName = '') {
    const catResponse = await this.opensearchClient.cat.indices({
      index: indexName,
      format: 'json',
    });
    const csv = jsonToCsv(catResponse.body);
    return indexName === '' ? `There are ${csv.split('\n').length - 1} indices.\n${csv}` : csv;
  }

  public async indexExists(indexName: string) {
    const indexExistsResponse = await this.opensearchClient.indices.exists({
      index: indexName,
    });

    return indexExistsResponse.body
      ? 'Index exists in the OpenSearch Cluster'
      : 'One or more specified Index do not exist';
  }
}
