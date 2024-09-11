/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EmbeddableFactoryDefinition,
  EmbeddableOutput,
  ErrorEmbeddable,
  IContainer,
  EmbeddableInput,
  SavedObjectEmbeddableInput,
} from '../../../../../../src/plugins/embeddable/public';

interface VisInput {
  title?: string;
  description?: string;
  visualizationState?: string;
  uiState?: string;
}

export interface NLQVisualizationInput extends SavedObjectEmbeddableInput {
  visInput?: VisInput;
}

export interface NLQVisualizationOutput extends EmbeddableOutput {
  editPath: string;
  editApp: string;
  editUrl: string;
  visTypeName: string;
}
