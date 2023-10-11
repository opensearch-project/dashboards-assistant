/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsFindResponse } from '../../../../src/core/server';
import { SavedObjectAttributes } from '../../../../src/core/types';

export const CHAT_SAVED_OBJECT = 'assistant-chat';
export const SAVED_OBJECT_VERSION = 1;

export interface ISession extends SavedObjectAttributes {
  title: string;
  version: number;
  createdTimeMs: number;
  messages: IMessage[];
}

export type ISessionFindResponse = SavedObjectsFindResponse<ISession>;

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
  traceID?: string; // used for tracing agent calls
  toolsUsed?: string[];
  contentType: 'error' | 'markdown' | 'visualization' | 'ppl_visualization';
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
    | { actionType: 'send_as_input' | 'copy' | 'view_in_dashboards' }
    | {
        actionType: 'view_ppl_visualization';
        metadata: { query: string; question: string };
      }
  );
