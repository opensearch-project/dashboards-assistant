/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DashboardStart } from '../../../src/plugins/dashboard/public';
import { EmbeddableSetup, EmbeddableStart } from '../../../src/plugins/embeddable/public';
import { IMessage, ISuggestedAction } from '../common/types/chat_saved_object_attributes';
import { IChatContext } from './contexts/chat_context';
import { MessageContentProps } from './tabs/chat/messages/message_content';

export interface RenderProps {
  props: MessageContentProps;
  chatContext: IChatContext;
}

// TODO should pair with server side registered output parser
export type ContentRenderer = (content: unknown, renderProps: RenderProps) => React.ReactElement;
export type ActionExecutor = (params: Record<string, unknown>) => void;
export interface AssistantActions {
  send: (input: IMessage) => Promise<void>;
  loadChat: (sessionId?: string, title?: string) => Promise<void>;
  openChatUI: (sessionId?: string) => void;
  executeAction: (suggestedAction: ISuggestedAction, message: IMessage) => Promise<void>;
  abortAction: (sessionId?: string) => Promise<void>;
  regenerate: (interactionId: string) => Promise<void>;
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
   * Returns true if chat UI is enabled.
   */
  chatEnabled: () => boolean;
  /**
   * Returns true if current user has permission to use assistant features.
   */
  userHasAccess: () => Promise<boolean>;
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
