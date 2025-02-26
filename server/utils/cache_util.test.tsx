/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LRUCache } from './cache_util';

describe('LRUCache', () => {
  let cache: LRUCache<number, string>;
  beforeEach(() => {
    // Initialize a new LRUCache instance before each test
    cache = new LRUCache<number, string>(3);
  });

  it('should retrieve an item from the cache', () => {
    cache.setCache(1, 'value1');
    const result = cache.getCache(1);
    expect(result).toBe('value1');
  });

  it('should return null for a non-existent cache key', () => {
    const result = cache.getCache(999);
    expect(result).toBeNull();
  });

  it('should set an item in the cache', () => {
    cache.setCache(2, 'value2');
    const result = cache.getCache(2);
    expect(result).toBe('value2');
  });

  it('should evict the least recently used item when max size is reached', () => {
    cache.setCache(1, 'value1');
    cache.setCache(2, 'value2');
    cache.setCache(3, 'value3');
    cache.setCache(4, 'value4'); // This should evict key 1 since it's the least recently used

    expect(cache.getCache(1)).toBeNull();
    expect(cache.getCache(2)).toBe('value2');
    expect(cache.getCache(3)).toBe('value3');
    expect(cache.getCache(4)).toBe('value4');
  });

  it('should update the value of an existing key and move it to the end (MRU)', () => {
    cache.setCache(1, 'value1');
    cache.setCache(2, 'value2');
    cache.setCache(3, 'value3');
    cache.setCache(1, 'updatedValue1');

    const cacheOrder = cache.getAllCache();

    expect(cacheOrder).toEqual([
      { key: 2, value: 'value2' },
      { key: 3, value: 'value3' },
      { key: 1, value: 'updatedValue1' },
    ]);

    expect(cache.getCache(1)).toBe('updatedValue1');
    expect(cache.getCache(2)).toBe('value2');
    expect(cache.getCache(3)).toBe('value3');
  });

  it('should evict the least recently used item when max size is exceeded after updates', () => {
    cache.setCache(1, 'value1');
    cache.setCache(2, 'value2');
    cache.setCache(3, 'value3');
    cache.setCache(2, 'updatedValue2'); // Move key 2 to MRU position
    cache.setCache(4, 'value4'); // This should evict key 1 since key 2 was recently updated

    expect(cache.getCache(1)).toBeNull();
    expect(cache.getCache(2)).toBe('updatedValue2');
    expect(cache.getCache(3)).toBe('value3');
    expect(cache.getCache(4)).toBe('value4');
  });

  it('should clear a specific cache key', () => {
    cache.setCache(1, 'value1');
    cache.setCache(2, 'value2');
    cache.clearCache(1);

    expect(cache.getCache(1)).toBeNull();
    expect(cache.getCache(2)).toBe('value2');
  });

  it('should clear all cache items', () => {
    cache.setCache(1, 'value1');
    cache.setCache(2, 'value2');
    cache.clearAllCache();

    expect(cache.getCache(1)).toBeNull();
    expect(cache.getCache(2)).toBeNull();
  });

  it('should handle a large number of items and evict correctly when max size is reached', () => {
    const maxSize = 999;
    cache = new LRUCache<number, string>(maxSize);

    for (let i = 1; i <= 1000; i++) {
      cache.setCache(i, `value${i}`);
    }

    expect(cache.getCache(1)).toBeNull();
    expect(cache.getCache(2)).toBe('value2');

    const cacheOrder = cache.getAllCache();

    // Check that cache order is correct (the 2nd has been move to the last)
    for (let i = 0; i < maxSize - 1; i++) {
      expect(cacheOrder[i].key).toBe(i + 3);
      expect(cacheOrder[i].value).toBe(`value${i + 3}`);
    }

    expect(cacheOrder[cacheOrder.length - 1].key).toBe(2);
    expect(cacheOrder[cacheOrder.length - 1].value).toBe('value2');

    expect(cache.getCache(1000)).toBe('value1000');
    expect(cache.getCache(999)).toBe('value999');
    expect(cache.getCache(998)).toBe('value998');
  });
});
