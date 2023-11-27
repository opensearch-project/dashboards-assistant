/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IInput, IOutput, Interaction } from '../../common/types/chat_saved_object_attributes';

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
        content: interaction.response,
        traceId: interaction.interaction_id,
      },
    ];
    return [inputItem, ...outputItems];
  },
};
