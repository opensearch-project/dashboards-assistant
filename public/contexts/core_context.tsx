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
import { ConversationLoadService, ConversationsService, DataSourceService } from '../services';

export interface AssistantServices extends Required<OpenSearchDashboardsServices> {
  setupDeps: AssistantPluginSetupDependencies;
  startDeps: AssistantPluginStartDependencies;
  conversationLoad: ConversationLoadService;
  conversations: ConversationsService;
  // This service is maintained in chatbot instead of dataSource exported from core plugin.
  dataSource: DataSourceService;
}

export const useCore: () => OpenSearchDashboardsReactContextValue<
  AssistantServices
> = useOpenSearchDashboards;
