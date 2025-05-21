/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import uuid from 'uuid';

import { getDashboard, getDashboardVersion } from '../../services';
import { DashboardUrlGeneratorState } from '../../../../../src/plugins/dashboard/public/url_generator';
import { setStateToOsdUrl } from '../../../../../src/plugins/opensearch_dashboards_utils/public';

interface PanelConfig {
  id: string;
  version: string;
  type: string;
  panelIndex: string;
  gridData: {
    x: number;
    y: number;
    w: number;
    h: number;
    i: string;
  };
}

export const createDashboard = async (objects: Array<{ id: string; type: string }>) => {
  const dashboardService = getDashboard();
  const loader = dashboardService.getSavedDashboardLoader();
  const dashboard = await loader.get();
  const panels: PanelConfig[] = [];
  const { version } = getDashboardVersion();

  const PANEL_WIDTH = 24;
  const PANEL_HEIGHT = 15;
  let x = 0;
  let y = 0;
  for (const obj of objects) {
    const panelIndex = uuid.v4();
    panels.push({
      version,
      id: obj.id,
      type: obj.type,
      panelIndex,
      gridData: {
        i: panelIndex,
        x,
        y,
        w: PANEL_WIDTH,
        h: PANEL_HEIGHT,
      },
    });
    x = x + PANEL_WIDTH;

    if (x >= 48) {
      x = 0;
      y = y + PANEL_HEIGHT;
    }
  }

  dashboard.panelsJSON = JSON.stringify(panels);
  dashboard.title = `[AI Generated] - ${uuid.v4()}`;
  dashboard.description = 'The dashboard was created by OpenSearch dashboard assistant';

  const dashboardUrlGenerator = dashboardService.dashboardUrlGenerator;
  const state: DashboardUrlGeneratorState = {};
  const dashboardUrl = await dashboardUrlGenerator?.createUrl(state);
  if (!dashboardUrl) {
    throw new Error('Failed to generate dashboard URL');
  }

  const appState = {
    panels: panels.map((panel) => ({
      embeddableConfig: {},
      gridData: {
        h: panel.gridData.h,
        i: panel.gridData.i,
        w: panel.gridData.w,
        x: panel.gridData.x,
        y: panel.gridData.y,
      },
      id: panel.id,
      panelIndex: panel.panelIndex,
      type: panel.type,
      version: panel.version,
    })),
  };

  const finalUrl = setStateToOsdUrl('_a', appState, { useHash: true }, dashboardUrl);
  dashboard.url = finalUrl;

  return dashboard;
};
