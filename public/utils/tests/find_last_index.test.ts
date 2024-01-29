/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { findLastIndex } from '../find_last_index';

describe('findLastIndex should return consistent value', () => {
  it('should return -1 if element not found', () => {
    expect(findLastIndex([1, 2, 3, 3, 4], (item) => item === 5)).toBe(-1);
    expect(findLastIndex([], () => true)).toBe(-1);
  });
  it('should return consistent index if element found', () => {
    expect(findLastIndex([1, 2, 3, 4], (item) => item === 3)).toBe(2);
    expect(findLastIndex([1, 2, 3, 3, 4], (item) => item === 3)).toBe(3);
    expect(findLastIndex([1, 2, 3, 4, 4], (item) => item === 4)).toBe(4);
    expect(findLastIndex([1, 1, 2, 3, 4], (item) => item === 1)).toBe(1);
  });
});
