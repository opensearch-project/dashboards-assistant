/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IDataFrame } from '../../../src/plugins/data/common';
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
        results: IDataFrame | undefined;
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
