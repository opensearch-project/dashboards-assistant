/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Doubly linked list node
interface ListNode<K, V> {
  key: K; // Cache key
  value: V; // Cache data
  prev: ListNode<K, V> | null; // Previous node
  next: ListNode<K, V> | null; // Next node
}

// LRU Cache with a size limit using doubly linked list
export class LRUCache<K, V> {
  private cache: Map<K, ListNode<K, V>> = new Map(); // Stores key-to-node mapping
  private head: ListNode<K, V> | null = null; // Head of the doubly linked list (LRU end)
  private tail: ListNode<K, V> | null = null; // Tail of the doubly linked list (MRU end)
  private maxSize: number; // Maximum cache size

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  // Get the entire cache in the LRU order
  public getAllCache(): Array<{ key: K; value: V }> {
    const result: Array<{ key: K; value: V }> = [];
    let current = this.head;

    while (current) {
      result.push({ key: current.key, value: current.value });
      current = current.next;
    }

    return result;
  }

  // Print internal cache for debug
  public print() {
    let current = this.head;
    while (current) {
      console.log(`Key: ${current.key}, Value: ${current.value}`);
      current = current.next;
    }
  }

  // Get data from cache by cacheKey and update LRU order
  public getCache(cacheKey: K): V | null {
    if (this.cache.has(cacheKey)) {
      const node = this.cache.get(cacheKey);
      if (node) {
        this.moveToEnd(node);
        return node.value;
      }
    }
    return null;
  }

  // Set data in cache for a specific cacheKey
  public setCache(cacheKey: K, data: V): void {
    if (this.cache.has(cacheKey)) {
      const node = this.cache.get(cacheKey);
      if (node) {
        node.value = data;
        this.moveToEnd(node);
      }
    } else {
      if (this.cache.size >= this.maxSize) {
        this.evict();
      }
      const newNode = this.createNode(cacheKey, data);
      this.cache.set(cacheKey, newNode);
      this.addToTail(newNode);
    }
  }

  // Clear data from cache for a specific cacheKey
  public clearCache(cacheKey: K): void {
    const node = this.cache.get(cacheKey);
    if (node) {
      this.cache.delete(cacheKey);
      this.removeNode(node);
    }
  }

  // Clear all data from the cache
  public clearAllCache(): void {
    this.cache.clear();
    this.head = this.tail = null;
  }

  // Create a ListNode instance
  private createNode(key: K, value: V): ListNode<K, V> {
    return {
      key,
      value,
      prev: null,
      next: null,
    };
  }

  // Add a node to the tail (MRU)
  private addToTail(node: ListNode<K, V>): void {
    if (!this.tail) {
      this.head = this.tail = node;
    } else {
      this.tail.next = node;
      node.prev = this.tail;
      this.tail = node;
    }
  }

  // Move a node to the tail (most recently used)
  private moveToEnd(node: ListNode<K, V>): void {
    if (node === this.tail) return;

    this.removeNode(node);
    this.addToTail(node);
  }

  // Remove a node from the doubly linked list
  private removeNode(node: ListNode<K, V>): void {
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;

    if (node === this.head) this.head = node.next;
    if (node === this.tail) this.tail = node.prev;

    node.prev = node.next = null;
  }

  // Evict the least recently used item (head of the list)
  private evict(): void {
    if (this.head) {
      const evictKey = this.head.key;
      this.cache.delete(evictKey);
      this.removeNode(this.head);
    }
  }
}
