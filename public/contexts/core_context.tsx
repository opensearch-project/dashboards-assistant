/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  OpenSearchDashboardsReactContextValue,
  OpenSearchDashboardsServices,
  useOpenSearchDashboards,
} from '../../../../src/plugins/opensearch_dashboards_react/public';
import { AssistantPluginStartDependencies, AssistantPluginSetupDependencies } from '../types';
import { ConversationLoadService, ConversationsService } from '../services';

export interface AssistantServices extends Required<OpenSearchDashboardsServices> {
  setupDeps: AssistantPluginSetupDependencies;
  startDeps: AssistantPluginStartDependencies;
  conversationLoad: ConversationLoadService;
  conversations: ConversationsService;
}

export const useCore: () => OpenSearchDashboardsReactContextValue<
  AssistantServices
> = useOpenSearchDashboards;
