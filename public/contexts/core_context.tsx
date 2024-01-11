/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  OpenSearchDashboardsReactContextValue,
  OpenSearchDashboardsServices,
  useOpenSearchDashboards,
} from '../../../../src/plugins/opensearch_dashboards_react/public';
import { AppPluginStartDependencies, SetupDependencies } from '../types';
import { ConversationLoadService } from '../services/conversation_load_service';
import { ConversationsService } from '../services/conversations_service';

export interface AssistantServices extends Required<OpenSearchDashboardsServices> {
  setupDeps: SetupDependencies;
  startDeps: AppPluginStartDependencies;
  conversationLoad: ConversationLoadService;
  conversations: ConversationsService;
}

export const useCore: () => OpenSearchDashboardsReactContextValue<
  AssistantServices
> = useOpenSearchDashboards;
