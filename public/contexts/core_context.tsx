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
import { SessionLoadService } from '../services/session_load_service';

export interface AssistantServices extends Required<OpenSearchDashboardsServices> {
  setupDeps: SetupDependencies;
  startDeps: AppPluginStartDependencies;
  sessionLoad: SessionLoadService;
}

export const useCore: () => OpenSearchDashboardsReactContextValue<
  AssistantServices
> = useOpenSearchDashboards;
