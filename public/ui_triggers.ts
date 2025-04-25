/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Trigger, UiActionsSetup } from '../../../src/plugins/ui_actions/public';

export const AI_ASSISTANT_QUERY_EDITOR_TRIGGER = 'AI_ASSISTANT_QUERY_EDITOR_TRIGGER';

declare module '../../../src/plugins/ui_actions/public' {
  export interface TriggerContextMapping {
    [AI_ASSISTANT_QUERY_EDITOR_TRIGGER]: {
      datasetId: string;
      datasetType: string;
      dataSourceId?: string;
      searchState?: {
        hasError: boolean;
        results: number | undefined;
      };
    };
  }
}

const aiAssistantTrigger: Trigger<'AI_ASSISTANT_QUERY_EDITOR_TRIGGER'> = {
  id: AI_ASSISTANT_QUERY_EDITOR_TRIGGER,
};

export const bootstrap = (uiActions: UiActionsSetup) => {
  uiActions.registerTrigger(aiAssistantTrigger);
};
