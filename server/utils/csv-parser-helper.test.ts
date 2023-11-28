/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getJsonFromString } from './csv-parser-helper';

describe('getJsonFromString', () => {
  it('return correct answer', async () => {
    expect(await getJsonFromString('title,id\n1,2')).toEqual([
      {
        title: '1',
        id: '2',
      },
    ]);
  });

  it('return empty array when string is not in correct format', async () => {
    expect(await getJsonFromString('1,2')).toEqual([]);
  });
});
