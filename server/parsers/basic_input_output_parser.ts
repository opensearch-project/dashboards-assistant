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

export const BasicInputOutputParser = {
  order: 0,
  id: 'output_message',
  async parserProvider(interaction: Interaction) {
    const suggestedOutputString = interaction.additional_info?.['QuestionSuggestor.output'] as
      | string
      | null;
    let suggestedActions: string[] = [];
    try {
      suggestedActions = JSON.parse(suggestedOutputString || '[]');
    } catch (e) {
      suggestedActions = [];
    }
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
