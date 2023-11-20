/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IMessage } from '../../common/types/chat_saved_object_attributes';
import { Interaction, MessageParser } from '../types';
import { MessageParserHelper } from './message_parser_helper';

export class MessageParserRunner {
  constructor(private readonly messageParsers: MessageParser[]) {}
  async run(interaction: Interaction): Promise<IMessage[]> {
    const messageParserHelper = new MessageParserHelper();
    for (const messageParser of this.messageParsers) {
      await messageParser.parserProvider(interaction, messageParserHelper);
    }
    return messageParserHelper.messages;
  }
}
