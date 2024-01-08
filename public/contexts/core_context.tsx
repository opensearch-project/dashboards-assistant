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
import { SessionLoadService, SessionsService } from '../services';

export interface AssistantServices extends Required<OpenSearchDashboardsServices> {
  setupDeps: AssistantPluginSetupDependencies;
  startDeps: AssistantPluginStartDependencies;
  sessionLoad: SessionLoadService;
  sessions: SessionsService;
}

export const useCore: () => OpenSearchDashboardsReactContextValue<
  AssistantServices
> = useOpenSearchDashboards;
