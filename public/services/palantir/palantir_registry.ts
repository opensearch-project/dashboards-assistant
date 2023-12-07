/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import EventEmitter from 'events';
import { Palantir, Palantiri } from '../../types';

export class PalantirRegistry extends EventEmitter {
  private registry: Palantiri = new Map();
  private errorOutput: Palantir = {
    key: 'error',
    suggestion: 'Error',
  };

  private mapper = (palantir: Palantir) => {
    return {
      key: palantir.key,
      description: palantir.description,
      suggestion: palantir.suggestion,
    };
  };

  // TODO: close suggestion
  public open(item: Palantir) {
    this.emit('onSuggestion', {
      suggestion: this.getSuggestion(item.key),
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
    if (!this.registry.has(key)) return this.errorOutput;
    return this.registry.get(key) as Palantir;
  }

  public getAll(): Palantir[] {
    return Array.from(this.registry.values());
  }

  public getSuggestion(key: string) {
    return this.get(key).suggestion;
  }

  public getDescription(key: string) {
    return this.get(key).description;
  }

  // TODO: two way service pltr component to chat bot
  // TODO: two way service chat bot to pltr component
}
