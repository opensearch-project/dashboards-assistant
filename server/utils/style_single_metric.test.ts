/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { checkSingleMetric, addTitleTextLayer } from './style_single_metric';

describe('checkSingleMetric', () => {
  it('should return true when the input sample data only have one value', () => {
    const input = '"[{\\"count()\\":13059}]"';
    expect(checkSingleMetric(input)).toBe(true);
  });

  it('should return false when the format is invalid', () => {
    const input = `
     "[{\"flight_count\":5,\"DestCountry\":\"AE\"},{\"flight_count\":55,\"DestCountry\":\"AR\"}]"
    `;
    expect(checkSingleMetric(input)).toBe(false);
  });
});

describe('addTitleTextLayer', () => {
  it('should add a title text layer when layer already exists', () => {
    const input = {
      title: 'test',
      layer: [
        {
          mark: { type: 'bar' },
          encoding: { x: { field: 'count' } },
        },
      ],
    };

    const result = addTitleTextLayer(input);
    expect(result.layer).toHaveLength(2);
    expect(result.layer[1].encoding.text.value).toBe('test');
  });

  it('should create a layer array and add title when layer does not exist', () => {
    const input = {
      title: 'test',
      mark: { type: 'text', fontSize: 14 },
      encoding: { text: { field: 'count' } },
    };

    const result = addTitleTextLayer(input);
    expect(result.layer).toHaveLength(2);
    expect(result.layer[1].mark.type).toBe('text');
    expect(result.layer[1].encoding.text.value).toBe('test');
  });

  it('should return the original object if no title', () => {
    const input = {
      mark: { type: 'line' },
      encoding: { x: { field: 'date' }, y: { field: 'views' } },
    };

    const result = addTitleTextLayer(input);
    expect(result).toEqual(input);
  });
});
