/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { IInput, IOutput, Interaction } from '../../common/types/chat_saved_object_attributes';

const sanitize = (content: string) => {
  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify((window as unknown) as Window);
  return DOMPurify.sanitize(content, { FORBID_TAGS: ['img'] }).replace(/!+\[/g, '[');
};

const isEveryItemString = (array?: unknown) =>
  !!(Array.isArray(array) && array.every((item) => typeof item === 'string'));

export const parseSuggestedActions = (string: string): string[] => {
  if (!string) {
    return [];
  }
  const suggestedOutputString = string;
  let suggestedActions: string[] = [];
  try {
    suggestedActions = JSON.parse(suggestedOutputString || '[]');
  } catch (e) {
    suggestedActions = [];
  }

  if (suggestedActions.length) {
    return suggestedActions;
  }

  /**
   * Get json-like substring from a string
   *
   *  /\{               // Match an opening curly brace
   *    (?:            // Start a non-capturing group
   *      [^{}]        // Match any character that is not a curly brace
   *      |            // OR
   *      (?:          // Start a non-capturing group
   *        \{         // Match an opening curly brace
   *        [^{}]*     // Match any characters that are not curly braces (allowing nested structures)
   *        \}         // Match a closing curly brace
   *      )
   *    )*             // Repeat the non-capturing group zero or more times (allowing nested structures)
   *  \}/g             // Match a closing curly brace, and 'g' flag for global search
   *
   */
  const jsonPattern = /\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g;

  /**
   * Use the regular expression to find the JSON substring
   */
  const match = string.match(jsonPattern);

  const matchedResult = match && match[0];

  if (!matchedResult) {
    return [];
  }

  try {
    const parsedResult = JSON.parse(matchedResult);

    /**
     * Suggestion tool uses { response: [action1, action2] } in its prompt
     * so that the parsedResult may contains a response field.
     * If prompt changed, the logic here need to change accordingly.
     */
    if (parsedResult?.response && isEveryItemString(parsedResult.response)) {
      return parsedResult.response;
    }
  } catch (e) {
    return [];
  }

  return [];
};

export const BasicInputOutputParser = {
  order: 0,
  id: 'output_message',
  async parserProvider(interaction: Interaction) {
    const suggestedActions = parseSuggestedActions(
      (interaction.additional_info?.['QuestionSuggestor.output'] as string | null) || ''
    );
    const inputItem: IInput = {
      type: 'input',
      contentType: 'text',
      content: interaction.input,
    };
    const outputItems: IOutput[] = [
      {
        type: 'output',
        contentType: 'markdown',
        content: sanitize(interaction.response),
        traceId: interaction.interaction_id,
        suggestedActions: suggestedActions
          .filter((item) => item)
          .map((item) => ({
            actionType: 'send_as_input',
            message: item,
          })),
      },
    ];
    return [inputItem, ...outputItems];
  },
};
