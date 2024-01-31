/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import EventEmitter from 'events';
import { Palantir, Palantiri } from '../../types';
import { ISuggestedAction, Interaction } from '../../../common/types/chat_saved_object_attributes';

export class PalantirRegistry extends EventEmitter {
  private registry: Palantiri = new Map();

  private mapper = (palantir: Palantir) => {
    return {
      key: palantir.key,
      type: palantir.type,
      summary: palantir.summary,
      suggestions: palantir.suggestions,
    };
  };

  public open(item: Palantir, suggestion: string) {
    // TODO: passing palantir for future usage
    this.emit('onSuggestion', {
      suggestion,
    });
  }

  public register(item: Palantir | Palantir[]): void;
  public register(item: unknown) {
    if (Array.isArray(item)) {
      item.forEach((palantir: Palantir) => this.registry.set(palantir.key, this.mapper(palantir)));
    } else {
      const palantir = item as Palantir;
      this.registry.set(palantir.key, this.mapper(palantir));
    }
  }

  public get(key: string): Palantir {
    return this.registry.get(key) as Palantir;
  }

  public getAll(): Palantir[] {
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
    const palantir = Array.from(this.registry.values()).find(
      (value) => value.interactionId && value.interactionId === interactionId
    );
    if (!palantir) return;
    this.get(palantir.key).suggestions = suggestedActions
      .filter(({ actionType }) => actionType === 'send_as_input')
      .map(({ message }) => message);
  }

  public setInteractionId(interaction: Interaction | undefined) {
    if (!interaction || !interaction.interaction_id || !interaction.input) return;
    const palantir = Array.from(this.registry.values()).find(
      (value) => value.suggestions && value.suggestions.includes(interaction.input)
    );
    if (!palantir) return;
    this.registry.get(palantir.key)!.interactionId = interaction.interaction_id;
  }

  // TODO: two way service pltr component to chat bot
  // TODO: two way service chat bot to pltr component
}
