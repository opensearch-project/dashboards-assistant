/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IMessage } from '../../common/types/chat_saved_object_attributes';
import { IMessageParserHelper } from '../types';

export class MessageParserHelper implements IMessageParserHelper {
  public messages: IMessage[] = [];
  addMessage(message: IMessage) {
    this.messages.push(message);
    return true;
  }
}
