/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'crypto';
import { LRUCache } from './cache_util';

const indexCacheKey = 'IndexCache';
const indexCacheSize = 1000;

// Cache to store the data for checking the index is log-related or not.
export class IndexCacheData {
  isLogRelated: boolean;
  reason: string;
  cacheKey: string;

  public static generateCacheKey(indexName: string, dataSourceId: string): string {
    const combinedString = `${dataSourceId}_${indexName}`;
    return createHash('sha256').update(combinedString).digest('hex');
  }

  constructor(isLogRelated: boolean, reason: string, indexName: string, dataSourceId: string) {
    this.isLogRelated = isLogRelated;
    this.reason = reason;
    this.cacheKey = IndexCacheData.generateCacheKey(indexName, dataSourceId);
  }
}

// Create an instance of LRUCache for IndexCacheData.
const indexLRUCache = new LRUCache<string, IndexCacheData>(indexCacheSize, indexCacheKey);

export const getIndexCache = (indexName: string, dataSourceId: string): IndexCacheData | null => {
  return indexLRUCache.getCache(IndexCacheData.generateCacheKey(indexName, dataSourceId));
};

export const setIndexCache = (data: IndexCacheData): void => {
  return indexLRUCache.setCache(data.cacheKey, data);
};

export const saveCache = (): void => {
  return indexLRUCache.saveCache();
};

export const clearIndexCache = (indexName: string, dataSourceId: string): void => {
  return indexLRUCache.clearCache(IndexCacheData.generateCacheKey(indexName, dataSourceId));
};

export const clearAllIndexCache = (): void => {
  return indexLRUCache.clearAllCache();
};
