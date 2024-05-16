/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import EventEmitter from 'events';
import { IncontextInsight, IncontextInsights } from '../../types';
import { ISuggestedAction, Interaction } from '../../../common/types/chat_saved_object_attributes';

// TODO: implement chat to incontext insight interaction
export class IncontextInsightRegistry extends EventEmitter {
  private registry: IncontextInsights = new Map();
  private enabled: boolean = false;

  private mapper = (incontextInsight: IncontextInsight) => {
    return {
      key: incontextInsight.key,
      type: incontextInsight.type,
      summary: incontextInsight.summary,
      suggestions: incontextInsight.suggestions,
    };
  };

  public isEnabled() {
    return this.enabled;
  }

  public setIsEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public open(item: IncontextInsight, suggestion: string) {
    // TODO: passing incontextInsight for future usage
    this.emit('onSuggestion', {
      suggestion,
    });
  }

  public register(item: IncontextInsight | IncontextInsight[]): void;
  public register(item: unknown) {
    if (Array.isArray(item)) {
      item.forEach((incontextInsight: IncontextInsight) =>
        this.registry.set(incontextInsight.key, this.mapper(incontextInsight))
      );
    } else {
      const incontextInsight = item as IncontextInsight;
      this.registry.set(incontextInsight.key, this.mapper(incontextInsight));
    }
  }

  public get(key: string): IncontextInsight {
    return this.registry.get(key) as IncontextInsight;
  }

  public getAll(): IncontextInsight[] {
    return Array.from(this.registry.values());
  }

  public getSummary(key: string) {
    return this.get(key).summary;
  }

  public getSuggestions(key: string) {
    if (!this.get(key) || !this.get(key).suggestions) return [];
    return this.get(key).suggestions!;
  }

  public setSuggestionsByInteractionId(
    interactionId: string | undefined,
    suggestedActions: ISuggestedAction[]
  ) {
    if (
      !interactionId ||
      suggestedActions.filter(({ actionType }) => actionType === 'send_as_input').length === 0
    )
      return;
    const incontextInsight = Array.from(this.registry.values()).find(
      (value) => value.interactionId && value.interactionId === interactionId
    );
    if (!incontextInsight) return;
    this.get(incontextInsight.key).suggestions = suggestedActions
      .filter(({ actionType }) => actionType === 'send_as_input')
      .map(({ message }) => message);
  }

  public setInteraction(interaction: Interaction | undefined) {
    if (!interaction || !interaction.interaction_id || !interaction.input) return;
    const incontextInsight = Array.from(this.registry.values()).find(
      (value) => value.suggestions && value.suggestions.includes(interaction.input)
    );
    if (!incontextInsight) return;
    this.registry.get(incontextInsight.key)!.interactionId = interaction.interaction_id;
  }
}
