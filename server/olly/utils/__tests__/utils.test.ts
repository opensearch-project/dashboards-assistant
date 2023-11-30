/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { flatten, jsonToCsv } from '../utils';

describe('utils', () => {
  it('converts json to csv', () => {
    const csv = jsonToCsv([
      { key1: 'value1', key2: 'value2', key3: 'value3' },
      { key4: 'value4', key5: 'value5', key6: 'value6' },
      { key7: 'value7', key8: 'value8', key9: 'value9' },
    ]);
    expect(csv).toEqual(
      'row_number,key1,key2,key3\n1,value1,value2,value3\n2,value4,value5,value6\n3,value7,value8,value9'
    );
  });

  it('handles empty json', () => {
    const csv = jsonToCsv([]);
    expect(csv).toEqual('row_number\n');
  });

  it('flattens nested objects', () => {
    const flattened = flatten([
      {
        key1: { key2: 'value1' },
        key3: {
          key4: 'value2',
          key5: { key6: 'value3', key7: [{ key8: 'value4' }, { key9: 'value5' }] },
        },
      },
      { key10: { key11: 'value6' } },
    ]);
    expect(flattened).toEqual([
      {
        'key1.key2': 'value1',
        'key3.key4': 'value2',
        'key3.key5.key6': 'value3',
        'key3.key5.key7.0.key8': 'value4',
        'key3.key5.key7.1.key9': 'value5',
      },
      {
        'key10.key11': 'value6',
      },
    ]);
  });
});
