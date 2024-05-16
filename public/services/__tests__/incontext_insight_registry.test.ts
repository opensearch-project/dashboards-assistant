/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IncontextInsightRegistry } from '../incontext_insight';
import { IncontextInsight } from '../../types';
import { ISuggestedAction, Interaction } from '../../../common/types/chat_saved_object_attributes';

describe('IncontextInsightRegistry', () => {
  let registry: IncontextInsightRegistry;
  let insight: IncontextInsight;
  let insight2: IncontextInsight;

  beforeEach(() => {
    registry = new IncontextInsightRegistry();
    insight = {
      key: 'test1',
      summary: 'test',
      suggestions: ['suggestion1'],
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

  it('checks if the registry is disabled on default', () => {
    expect(registry.isEnabled()).toBe(false);
  });

  it('checks if the registry is enabled after setting', () => {
    registry.setIsEnabled(true);
    expect(registry.isEnabled()).toBe(true);
  });

  it('sets interactionId when setInteraction is called', () => {
    registry.register([insight, insight2]);

    const interaction: Interaction = {
      interaction_id: '123',
      input: insight.suggestions![0],
      response: 'test response',
      conversation_id: '321',
      create_time: new Date().toISOString(),
    };

    registry.setInteraction(interaction);

    const updatedInsight = registry.get(insight.key);
    expect(updatedInsight.interactionId).toBe(interaction.interaction_id);

    const nonUpdatedInsight = registry.get(insight2.key);
    expect(nonUpdatedInsight.interactionId).toBeUndefined();
  });

  it('sets suggestions when setSuggestionsByInteractionId is called', () => {
    registry.register([insight, insight2]);

    const interaction: Interaction = {
      interaction_id: '123',
      input: insight.suggestions![0],
      response: 'test response',
      conversation_id: '321',
      create_time: new Date().toISOString(),
    };

    registry.setInteraction(interaction);
    const updatedInsight = registry.get(insight.key);

    const interactionId = updatedInsight.interactionId;
    const suggestedActions: ISuggestedAction[] = [
      { actionType: 'send_as_input', message: 'suggestion2' },
      { actionType: 'send_as_input', message: 'suggestion3' },
    ];

    registry.setSuggestionsByInteractionId(interactionId, suggestedActions);

    expect(registry.getSuggestions(insight.key)).toEqual(
      suggestedActions.map(({ message }) => message)
    );
    expect(registry.getSuggestions(insight2.key)).toEqual([]);
  });
});
