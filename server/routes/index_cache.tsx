/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'crypto';
import { LRUCache } from '../utils/cache_util';

const indexCacheSize = 1000;

// Cache to store the data for checking the index is log-related or not.
export class IndexCacheData {
  isLogRelated: boolean;
  reason: string;

  public static generateCacheKey(indexName: string, dataSourceId: string): string {
    const combinedString = `${dataSourceId}-${indexName}`;
    return createHash('sha256').update(combinedString).digest('hex');
  }

  constructor(isLogRelated: boolean, reason: string) {
    this.isLogRelated = isLogRelated;
    this.reason = reason;
  }
}

// Create an instance of LRUCache for IndexCacheData.
const indexLRUCache = new LRUCache<string, IndexCacheData>(indexCacheSize);

export const getIndexCache = (indexName: string, dataSourceId: string): IndexCacheData | null => {
  return indexLRUCache.getCache(IndexCacheData.generateCacheKey(indexName, dataSourceId));
};

export const setIndexCache = (
  data: IndexCacheData,
  indexName: string,
  dataSourceId: string
): void => {
  return indexLRUCache.setCache(IndexCacheData.generateCacheKey(indexName, dataSourceId), data);
};

export const getAllIndexCache = (): unknown => {
  return indexLRUCache.getAllCache();
};

export const clearIndexCache = (indexName: string, dataSourceId: string): void => {
  return indexLRUCache.clearCache(IndexCacheData.generateCacheKey(indexName, dataSourceId));
};

export const clearAllIndexCache = (): void => {
  return indexLRUCache.clearAllCache();
};
