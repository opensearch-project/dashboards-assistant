/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectAttributes } from '../../../../src/core/types';
import { SavedVisualization } from './explorer';

export const VISUALIZATION_SAVED_OBJECT = 'observability-visualization';
export const CHAT_SAVED_OBJECT = 'observability-chat';
export const OBSERVABILTY_SAVED_OBJECTS = [VISUALIZATION_SAVED_OBJECT, CHAT_SAVED_OBJECT] as const;
export const SAVED_OBJECT_VERSION = 1;

export interface VisualizationSavedObjectAttributes extends SavedObjectAttributes {
  title: string;
  description: string;
  version: number;
  createdTimeMs: number;
  savedVisualization: SavedVisualization;
}

export interface IChat extends SavedObjectAttributes {
  title: string;
  version: number;
  createdTimeMs: number;
  messages: IMessage[];
}

interface IInput extends SavedObjectAttributes {
  type: 'input';
  contentType: 'text';
  content: string;
  context?: {
    appId?: string;
  };
}
interface IOutput extends SavedObjectAttributes {
  type: 'output';
  contentType: 'markdown' | 'visualization' | 'ppl_visualization';
  content: string;
  suggestedActions?: ISuggestedAction[];
}
export type IMessage = IInput | IOutput;

interface ISuggestedActionBase extends SavedObjectAttributes {
  actionType: string;
  message: string;
}
export type ISuggestedAction = ISuggestedActionBase &
  (
    | { actionType: 'send_as_input' | 'copy' }
    | { actionType: 'save_and_view_ppl_query'; metadata: { query: string } }
  );
