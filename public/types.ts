/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DashboardStart } from '../../../src/plugins/dashboard/public';
import { EmbeddableSetup, EmbeddableStart } from '../../../src/plugins/embeddable/public';
import { IMessage, ISuggestedAction } from '../common/types/chat_saved_object_attributes';

// TODO should pair with server side registered output parser
export type ContentRenderer = (content: unknown) => React.ReactElement;
export type ActionExecutor = (params: Record<string, unknown>) => void;
export interface AssistantActions {
  send: (input: IMessage) => void;
  loadChat: (sessionId?: string, title?: string) => void;
  openChatUI: (sessionId?: string) => void;
  executeAction: (suggestedAction: ISuggestedAction, message: IMessage) => void;
  abortAction: (sessionId?: string) => void;
  regenerate: () => void;
}

export interface AppPluginStartDependencies {
  embeddable: EmbeddableStart;
  dashboard: DashboardStart;
}

export interface SetupDependencies {
  embeddable: EmbeddableSetup;
  securityDashboards?: {};
}

export interface AssistantSetup {
  registerContentRenderer: (contentType: string, render: ContentRenderer) => void;
  registerActionExecutor: (actionType: string, execute: ActionExecutor) => void;
  /**
   * Returns true if chat feature is enabled and current user has permission to use chat.
   */
  assistantEnabled: () => Promise<boolean>;
  assistantActions: Omit<AssistantActions, 'executeAction'>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AssistantStart {}

export interface UserAccount {
  username: string;
  tenant: string;
}

export interface ChatConfig {
  terms_accepted: boolean;
}

export type TabId = 'chat' | 'compose' | 'insights' | 'history' | 'trace';
