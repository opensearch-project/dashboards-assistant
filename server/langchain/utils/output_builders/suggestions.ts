/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IMessage,
  ISuggestedAction,
} from '../../../../common/types/observability_saved_object_attributes';
import { mergeMessages } from './utils';

export type SuggestedQuestions = Record<string, string>;

export const buildSuggestions = (suggestions: SuggestedQuestions, outputs: IMessage[]) => {
  const suggestedActions: ISuggestedAction[] = [];

  if (suggestions.question1) {
    suggestedActions.push({
      message: suggestions.question1,
      actionType: 'send_as_input',
    });
  }

  if (suggestions.question2) {
    suggestedActions.push({
      message: suggestions.question2,
      actionType: 'send_as_input',
    });
  }
  outputs[outputs.length - 1] = mergeMessages(outputs.at(-1)!, { suggestedActions });
  return outputs;
};
