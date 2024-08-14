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

    expect(mockFn).toHaveBeenCalledWith({
      contextContent: '',
      dataSourceId: undefined,
      suggestion: 'test suggestion',
    });
  });

  it('emits "onChatContinuation" event when continueInChat is called', () => {
    const mockFn = jest.fn();
    registry.on('onChatContinuation', mockFn);

    registry.continueInChat(insight, 'test conversationId');

    expect(mockFn).toHaveBeenCalledWith({
      contextContent: '',
      dataSourceId: undefined,
      conversationId: 'test conversationId',
    });
  });

  it('adds item to registry when register is called with a single item', () => {
    registry.register(insight);

    expect(registry.get(insight.key)).toEqual(insight);
  });

  it('adds items to registry when register is called with an array of items', () => {
    registry.register([insight, insight2]);

    expect(registry.get(insight2.key)).toEqual(insight2);
  });

  it('checks if the registry is disabled on default', () => {
    expect(registry.isEnabled()).toBe(false);
  });

  it('checks if the registry is enabled after setting', () => {
    registry.setIsEnabled(true);
    expect(registry.isEnabled()).toBe(true);
  });
});
