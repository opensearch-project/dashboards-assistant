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

export interface AssistantServices extends Required<OpenSearchDashboardsServices> {
  setupDeps: SetupDependencies;
  startDeps: AppPluginStartDependencies;
}

export const useCore: () => OpenSearchDashboardsReactContextValue<
  AssistantServices
> = useOpenSearchDashboards;
