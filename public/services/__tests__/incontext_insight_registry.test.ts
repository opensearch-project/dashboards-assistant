/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IncontextInsightRegistry } from '../incontext_insight';
import { IncontextInsight } from '../../types';

describe('IncontextInsightRegistry', () => {
  let registry: IncontextInsightRegistry;
  let insight: IncontextInsight;
  let insight2: IncontextInsight;

  beforeEach(() => {
    registry = new IncontextInsightRegistry();
    insight = {
      key: 'test',
      summary: 'test',
      suggestions: [],
    };
    insight2 = {
      key: 'test2',
      summary: 'test',
      suggestions: [],
    };
  });

  it('emits "onSuggestion" event when open is called', () => {
    const mockFn = jest.fn();
    registry.on('onSuggestion', mockFn);

    registry.open(insight, 'test suggestion');

    expect(mockFn).toHaveBeenCalledWith({ suggestion: 'test suggestion' });
  });

  it('adds item to registry when register is called with a single item', () => {
    registry.register(insight);

    expect(registry.get(insight.key)).toEqual(insight);
  });

  it('adds items to registry when register is called with an array of items', () => {
    registry.register([insight, insight2]);

    expect(registry.get(insight2.key)).toEqual(insight2);
  });
});
