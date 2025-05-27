/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TEXT2PPL_AGENT_CONFIG_ID,
  TEXT2VEGA_RULE_BASED_AGENT_CONFIG_ID,
  TEXT2VEGA_WITH_INSTRUCTIONS_AGENT_CONFIG_ID,
} from '../common/constants/llm';
import { DEFAULT_DATA } from '../../../src/plugins/data/common';
import { UiActionsStart } from '../../../src/plugins/ui_actions/public';
import { AssistantServiceStart } from './services/assistant_service';
import { AI_ASSISTANT_QUERY_EDITOR_TRIGGER } from './ui_triggers';
import { CoreStart } from '../../../src/core/public';
import { DataPublicPluginStart } from '../../../src/plugins/data/public';
import { TEXT2DASH_APP_ID } from './text2dash';

interface Services {
  core: CoreStart;
  data: DataPublicPluginStart;
  uiActions: UiActionsStart;
  assistantService: AssistantServiceStart;
}

export function registerGenerateDashboardUIAction(services: Services) {
  services.uiActions.addTriggerAction(AI_ASSISTANT_QUERY_EDITOR_TRIGGER, {
    id: 'assistant_generate_dashboard_action',
    order: 10,
    getDisplayName: () => 'Data insights',
    getIconType: () => 'dashboard' as const,
    // T2Viz is only compatible with data sources that have certain agents configured
    isCompatible: async (context) => {
      // t2viz only supports selecting index pattern at the moment
      if (context.datasetType === DEFAULT_DATA.SET_TYPES.INDEX_PATTERN && context.datasetId) {
        const res = await services.assistantService.client.agentConfigExists(
          [
            TEXT2VEGA_RULE_BASED_AGENT_CONFIG_ID,
            TEXT2VEGA_WITH_INSTRUCTIONS_AGENT_CONFIG_ID,
            TEXT2PPL_AGENT_CONFIG_ID,
          ],
          {
            dataSourceId: context.dataSourceId,
          }
        );
        return res.exists;
      }
      return false;
    },
    execute: async (context) => {
      if (context.datasetId && context.datasetType === DEFAULT_DATA.SET_TYPES.INDEX_PATTERN) {
        const url = new URL(
          services.core.application.getUrlForApp(TEXT2DASH_APP_ID, {
            absolute: true,
            path: '/',
          })
        );
        url.searchParams.set('indexPatternId', context.datasetId);
        window.open(url.toString(), '_blank');
      }
    },
  });
}
