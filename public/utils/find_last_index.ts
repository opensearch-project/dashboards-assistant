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
  const index = [...array].reverse().findIndex(predicate);
  if (index === -1) {
    return -1;
  }
  return array.length - index - 1;
};
