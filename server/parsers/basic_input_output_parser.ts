/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IInput, IOutput } from '../../common/types/chat_saved_object_attributes';
import { Interaction, IMessageParserHelper } from '../types';

export const BasicInputOutputParser = {
  order: 0,
  id: 'output_message',
  async parserProvider(interaction: Interaction, messageParserHelper: IMessageParserHelper) {
    const inputItem: IInput = {
      type: 'input',
      contentType: 'text',
      content: interaction.input,
    };
    const outputItems: IOutput[] = [
      {
        type: 'output',
        contentType: 'markdown',
        content: interaction.response,
        traceId: interaction.interaction_id,
      },
    ];
    [inputItem, ...outputItems].forEach((item) => messageParserHelper.addMessage(item));
    return null;
  },
};
