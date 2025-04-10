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
import {
  VisualizationsSetup,
  VisualizationsStart,
} from '../../../src/plugins/visualizations/public';
import { DataPublicPluginSetup, DataPublicPluginStart } from '../../../src/plugins/data/public';
import { AppMountParameters, CoreStart } from '../../../src/core/public';
import { AssistantClient } from './services/assistant_client';
import { UiActionsSetup, UiActionsStart } from '../../../src/plugins/ui_actions/public';
import { ExpressionsSetup, ExpressionsStart } from '../../../src/plugins/expressions/public';
import { SavedObjectsStart } from '../../../src/plugins/saved_objects/public';
import {
  UsageCollectionStart,
  UsageCollectionSetup,
} from '../../../src/plugins/usage_collection/public';
import { QueryEnhancementsPluginSetup } from '../../../src/plugins/query_enhancements/public';

import { ConfigSchema } from '../common/types/config';

export interface RenderProps {
  props: MessageContentProps;
  chatContext: IChatContext;
}
// TODO should pair with server side registered output parser
export type MessageRenderer = (message: IMessage, renderProps: RenderProps) => React.ReactElement;
export type ActionExecutor = (params: Record<string, unknown>) => void;
export interface AssistantActions {
  send: (input: IMessage) => Promise<void>;
  loadChat: (conversationId?: string, nextToken?: string, title?: string) => Promise<void>;
  resetChat: () => void;
  openChatUI: (conversationId?: string) => void;
  executeAction: (suggestedAction: ISuggestedAction, message: IMessage) => Promise<void>;
  abortAction: (conversationId?: string) => Promise<void>;
  regenerate: (interactionId: string) => Promise<void>;
}

export interface AssistantPluginStartDependencies {
  data: DataPublicPluginStart;
  visualizations: VisualizationsStart;
  embeddable: EmbeddableStart;
  dashboard: DashboardStart;
  uiActions: UiActionsStart;
  expressions: ExpressionsStart;
  savedObjects: SavedObjectsStart;
  usageCollection?: UsageCollectionStart;
}

export interface AssistantPluginSetupDependencies {
  data: DataPublicPluginSetup;
  visualizations: VisualizationsSetup;
  embeddable: EmbeddableSetup;
  dataSourceManagement?: DataSourceManagementPluginSetup;
  usageCollection?: UsageCollectionSetup;
  uiActions: UiActionsSetup;
  expressions: ExpressionsSetup;
  queryEnhancements: QueryEnhancementsPluginSetup;
}

export interface AssistantSetup {
  dataSource: DataSourceServiceContract;
  registerMessageRenderer: (contentType: string, render: MessageRenderer) => void;
  registerActionExecutor: (actionType: string, execute: ActionExecutor) => void;
  /**
   * @deprecated please use `getFeatureStatus()`
   * Returns true if chat UI is enabled.
   */
  chatEnabled: () => boolean;
  /**
   * @deprecated please use `getFeatureStatus()`
   * Returns true if contextual assistant is enabled.
   */
  nextEnabled: () => boolean;
  getFeatureStatus: () => {
    chat: boolean;
    next: boolean;
    text2viz: boolean;
    alertInsight: boolean;
    smartAnomalyDetector: boolean;
  };
  assistantActions: Omit<AssistantActions, 'executeAction'>;
  assistantTriggers: { AI_ASSISTANT_QUERY_EDITOR_TRIGGER: string };
  registerIncontextInsight: IncontextInsightRegistry['register'];
  renderIncontextInsight: (component: React.ReactNode) => React.ReactNode;
}

export interface AssistantStart {
  dataSource: DataSourceServiceContract;
  assistantClient: AssistantClient;
}

export type StartServices = CoreStart &
  Omit<AssistantPluginStartDependencies, 'savedObjects'> & {
    setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
    config: ConfigSchema;
  };

export interface UserAccount {
  username: string;
}

export interface ChatConfig {
  terms_accepted: boolean;
}

export type IncontextInsights = Map<string, IncontextInsight>;

export interface ContextObj {
  context: string;
  additionalInfo: Record<string, string>;
  dataSourceId?: string;
}

export interface IncontextInsight {
  key: string;
  type?: IncontextInsightType;
  summary?: string;
  suggestions?: string[];
  interactionId?: string;
  contextProvider?: () => Promise<ContextObj>;
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

export interface NestedRecord<T = string> {
  [key: string]: T | NestedRecord<T>;
}

export interface DSL {
  query?: {
    bool?: {
      filter?: unknown[];
    };
  };
}
