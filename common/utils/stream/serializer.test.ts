/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { data } from 'jquery';
import { streamDeserializer, streamSerializer } from './serializer';

describe('streamSerializer', () => {
  it('should serialize a stream', () => {
    const serialized = streamSerializer({
      event: 'metadata',
      data: {},
    });
    expect(serialized).toMatchInlineSnapshot(`
      "event: metadata
      data: {}

      "
    `);
  });
});

describe('streamDeserializer', () => {
  it('should be able to deserialize a string', () => {
    const deserialized = streamDeserializer('event: metadata\ndata: {}\n\n');

    expect(deserialized).toEqual([
      {
        event: 'metadata',
        data: {},
        id: undefined,
      },
    ]);
  });
});
