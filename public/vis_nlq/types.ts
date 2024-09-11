/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from '../../../../src/plugins/saved_objects/public';

export interface VisNLQSavedObject extends SavedObject {
  id?: string;
  title: string;
  description?: string;
  visualizationState: string;
  uiState: string;
  version?: number;
}
