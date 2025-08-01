/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NLQVisualizationEmbeddableFactory } from './nlq_vis_embeddable_factory';

jest.mock('react-monaco-editor', () => () => null);

describe('NLQVisualizationEmbeddableFactory', () => {
  it('should NOT allow to create new NLQ viz from create new action', () => {
    const factory = new NLQVisualizationEmbeddableFactory();
    expect(factory.canCreateNew()).toBe(false);
  });
});
