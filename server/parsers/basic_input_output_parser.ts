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
      },
    ];
    return [inputItem, ...outputItems];
  },
};
