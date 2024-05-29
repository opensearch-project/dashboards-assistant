/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DashboardStart } from '../../../src/plugins/dashboard/public';
import { EmbeddableSetup, EmbeddableStart } from '../../../src/plugins/embeddable/public';
import { IMessage, ISuggestedAction } from '../common/types/chat_saved_object_attributes';
import { IChatContext } from './contexts/chat_context';
import { MessageContentProps } from './tabs/chat/messages/message_content';
import { DataSourceServiceContract, IncontextInsightRegistry } from './services';
import { DataSourceManagementPluginSetup } from '../../../src/plugins/data_source_management/public';

export interface RenderProps {
  props: MessageContentProps;
  chatContext: IChatContext;
}
// TODO should pair with server side registered output parser
export type MessageRenderer = (message: IMessage, renderProps: RenderProps) => React.ReactElement;
export type ActionExecutor = (params: Record<string, unknown>) => void;
export interface AssistantActions {
  send: (input: IMessage) => Promise<void>;
  loadChat: (conversationId?: string, title?: string) => Promise<void>;
  resetChat: () => void;
  openChatUI: (conversationId?: string) => void;
  executeAction: (suggestedAction: ISuggestedAction, message: IMessage) => Promise<void>;
  abortAction: (conversationId?: string) => Promise<void>;
  regenerate: (interactionId: string) => Promise<void>;
}

export interface AssistantPluginStartDependencies {
  embeddable: EmbeddableStart;
  dashboard: DashboardStart;
}

export interface AssistantPluginSetupDependencies {
  embeddable: EmbeddableSetup;
  dataSourceManagement?: DataSourceManagementPluginSetup;
}

export interface AssistantSetup {
  dataSource: DataSourceServiceContract;
  registerMessageRenderer: (contentType: string, render: MessageRenderer) => void;
  registerActionExecutor: (actionType: string, execute: ActionExecutor) => void;
  /**
   * Returns true if chat UI is enabled.
   */
  chatEnabled: () => boolean;
  assistantActions: Omit<AssistantActions, 'executeAction'>;
  registerIncontextInsight: IncontextInsightRegistry['register'];
  renderIncontextInsight: (component: React.ReactNode) => React.ReactNode;
}

export interface AssistantStart {
  dataSource: DataSourceServiceContract;
}

export interface UserAccount {
  username: string;
}

export interface ChatConfig {
  terms_accepted: boolean;
}

export type IncontextInsights = Map<string, IncontextInsight>;

export interface IncontextInsight {
  key: string;
  type?: IncontextInsightType;
  summary?: string;
  suggestions?: string[];
  interactionId?: string;
  contextProvider?: () => Promise<string>;
  datasourceId?: string;
}

export type IncontextInsightType =
  | 'suggestions'
  | 'generate'
  | 'summary'
  | 'summaryWithSuggestions'
  | 'chat'
  | 'chatWithSuggestions'
  | 'error';

export type TabId = 'chat' | 'compose' | 'insights' | 'history' | 'trace';
