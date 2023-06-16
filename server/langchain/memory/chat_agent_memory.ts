/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIChatMessage, BaseChatMessage, HumanChatMessage } from 'langchain/schema';
import { BufferMemory, ChatMessageHistory } from 'langchain/memory';
import { IMessage } from '../../../common/types/observability_saved_object_attributes';

const loadPastMessages = (messages: IMessage[]) => {
  const pastMessages: BaseChatMessage[] = [];
  messages.forEach((message) =>
    message.type === 'input'
      ? pastMessages.push(new HumanChatMessage(message.content))
      : pastMessages.push(new AIChatMessage(message.content))
  );
  return pastMessages;
};

export const memoryInit = (messages: IMessage[]) => {
  const pastMessages = loadPastMessages(messages);
  const memory = new BufferMemory({
    chatHistory: new ChatMessageHistory(pastMessages),
    returnMessages: true,
    memoryKey: 'chat_history',
    inputKey: 'input',
  });

  return memory;
};
