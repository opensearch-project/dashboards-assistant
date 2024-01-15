/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { IInput, IOutput } from '../../common/types/chat_saved_object_attributes';
import { MessageParser } from '../types';

const sanitize = (content: string) => {
  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify((window as unknown) as Window);
  return DOMPurify.sanitize(content, { FORBID_TAGS: ['img'] }).replace(/!+\[/g, '[');
};

const isStringArray = (array?: unknown): array is string[] =>
  Array.isArray(array) && array.every((item) => typeof item === 'string');

export const parseSuggestedActions = (value: string): string[] => {
  if (!value) {
    return [];
  }
  const suggestedOutputString = value;
  let suggestedActions: string[] = [];
  try {
    suggestedActions = JSON.parse(suggestedOutputString);
  } catch (e) {
    suggestedActions = [];
  }

  if (suggestedActions.length) {
    if (isStringArray(suggestedActions)) {
      return suggestedActions;
    }

    return [];
  }

  /**
   * Get json-like substring from a string
   *
   *  /\{                  // Match an opening curly brace
   *    .*                 // Match any preleading spaces and letters
   *    response[^\n]*\:   // Match "response" key because suggestion tool uses { response: [action1, action2] }
   *                       // in its prompt so that the parsedResult may contain a "response" field.
   *                       // If prompt changed, the logic here need to change accordingly.
   *    .*                 // Match any any string behind the "response:"
   *  \}/g             // Match a closing curly brace, and 'g' flag for global search
   *
   */
  const jsonPattern = /\{.*response[^\n]*\:.*\}/g;

  /**
   * Use the regular expression to find the JSON substring
   */
  const match = value.match(jsonPattern);

  const matchedResult = match && match[0];

  if (!matchedResult) {
    return [];
  }

  try {
    const parsedResult = JSON.parse(matchedResult);

    if (parsedResult?.response && isStringArray(parsedResult.response)) {
      return parsedResult.response;
    }
  } catch (e) {
    return [];
  }

  return [];
};

export const BasicInputOutputParser: MessageParser = {
  order: 0,
  id: 'output_message',
  async parserProvider(interaction, options) {
    /**
     * From UX, only the last interaction need to parse suggestedActions.
     */
    const isLatestInteraction =
      [...options.interactions].reverse()[0]?.interaction_id === interaction.interaction_id;
    const suggestedActions = isLatestInteraction
      ? parseSuggestedActions(
          (interaction.additional_info?.['QuestionSuggestor.output'] as string | null) || ''
        )
      : [];
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
        interactionId: interaction.interaction_id,
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
