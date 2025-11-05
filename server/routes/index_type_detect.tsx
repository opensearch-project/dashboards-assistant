/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { escape } from 'lodash';
import { AssistantClient } from '../services/assistant_client';
import { OpenSearchClient } from '../../../../src/core/server';
import { getIndexCache, setIndexCache, IndexCacheData } from './index_cache';

const INDEX_TYPE_DETECT_AGENT_CONFIG_ID = 'os_index_type_detect';

async function searchQuery(
  client: OpenSearchClient['transport'],
  path: string,
  method: string,
  query: Record<string, unknown> | undefined
) {
  return await client.request({
    path,
    method,
    body: query,
  });
}

async function searchSampleData(client: OpenSearchClient['transport'], indexName: string) {
  const query = {
    size: 5,
    query: {
      match_all: {},
    },
  };
  const response = await searchQuery(
    client,
    `/${encodeURIComponent(indexName)}/_search`,
    'POST',
    query
  );
  const sourceArray = response.body.hits.hits.map((hit: { _source: unknown }) => hit._source);
  return sourceArray;
}

async function searchIndexMapping(client: OpenSearchClient['transport'], indexName: string) {
  const response = await searchQuery(
    client,
    `/${encodeURIComponent(indexName)}/_mapping`,
    'GET',
    undefined
  );
  return response.body;
}

export async function detectIndexType(
  client: OpenSearchClient['transport'],
  assistantClient: AssistantClient,
  indexName: string,
  dataSourceId: string | undefined
): Promise<boolean> {
  const indexCache = getIndexCache(indexName, dataSourceId ? dataSourceId : '');
  if (indexCache) {
    return indexCache.isLogRelated;
  }

  try {
    const indexMapping = escape(JSON.stringify(await searchIndexMapping(client, indexName)));
    const sampleData = escape(JSON.stringify(await searchSampleData(client, indexName)));

    const response = await assistantClient.executeAgentByConfigName(
      INDEX_TYPE_DETECT_AGENT_CONFIG_ID,
      {
        sampleData,
        schema: indexMapping,
      }
    );

    const detectResult = JSON.parse(response.body.inference_results[0].output[0].result);
    if (detectResult) {
      setIndexCache(
        new IndexCacheData(detectResult.isRelated, detectResult.reason),
        indexName,
        dataSourceId ? dataSourceId : ''
      );
      return detectResult.isRelated;
    }
    return false;
  } catch (error) {
    console.error('Error detecting index type:', error.body || error.message);
    // Can not detect index type and return default as is not log related
    return false;
  }
}
