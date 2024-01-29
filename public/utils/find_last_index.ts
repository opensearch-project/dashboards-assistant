/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const findLastIndex = <T>(
  array: T[],
  predicate: (value: T, index: number, array: T[]) => unknown
) => {
  if (array.length === 0) {
    return -1;
  }
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i], i, array)) {
      return i;
    }
  }
  return -1;
};
