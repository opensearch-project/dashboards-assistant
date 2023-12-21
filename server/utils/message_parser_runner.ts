/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IMessage, Interaction } from '../../common/types/chat_saved_object_attributes';
import { MessageParser, ProviderOptions } from '../types';

export class MessageParserRunner {
  constructor(private readonly messageParsers: MessageParser[]) {}
  async run(interaction: Interaction, options: ProviderOptions): Promise<IMessage[]> {
    const sortedParsers = [...this.messageParsers];
    sortedParsers.sort((parserA, parserB) => {
      const { order: orderA = 999 } = parserA;
      const { order: orderB = 999 } = parserB;
      return orderA - orderB;
    });
    let results: IMessage[] = [];
    for (const messageParser of sortedParsers) {
      let tempResult: IMessage[] = [];
      try {
        tempResult = (await messageParser.parserProvider(interaction, options)) as IMessage[];
        /**
         * Make sure the tempResult is an array.
         */
        if (!Array.isArray(tempResult)) {
          tempResult = [];
        }
      } catch (e) {
        tempResult = [];
      }
      results = [
        ...results,
        ...tempResult.map((item, index) => ({
          ...item,
          messageId: `${interaction.interaction_id}_${index}`,
        })),
      ];
    }
    return results;
  }
}
