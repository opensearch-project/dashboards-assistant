/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BufferMemory, ChatMessageHistory } from 'langchain/memory';
import { AIMessage, BaseMessage, HumanMessage } from 'langchain/schema';
import { IMessage } from '../../../common/types/chat_saved_object_attributes';

const filterMessages = (messages: IMessage[]): IMessage[] => {
  // remove error outputs, unmatched input/output pairs
  const context = messages
    .filter((message) => !(message.type === 'output' && message.contentType === 'error'))
    .filter((message, i, arr) => !(message.type === 'input' && arr[i + 1]?.type !== 'output'));
  // keep only the last 5 input/output pairs, where the first message must be human input
  const inputIndices = context
    .map((message, i) => {
      if (message.type === 'input') return i;
    })
    .filter((i) => i !== undefined)
    .slice(-5);
  return inputIndices.length === 0 ? [] : context.slice(inputIndices[0]);
};

const convertToBaseMessages = (messages: IMessage[]): BaseMessage[] =>
  messages.map((message) =>
    message.type === 'input' ? new HumanMessage(message.content) : new AIMessage(message.content)
  );

/**
 * Creates {@link BufferMemory} based on previous conversations with the
 * following removed: initial AI messages because in claude the prompt must
 * start by human, error outputs, inputs without corresponding output,
 * conversations before the last 10 messages.
 *
 * @param messages - previous conversation messages
 * @returns memory based on filtered history
 */
export const memoryInit = (messages: IMessage[]) => {
  const pastMessages = convertToBaseMessages(filterMessages(messages));
  return new BufferMemory({
    chatHistory: new ChatMessageHistory(pastMessages),
    returnMessages: true,
    memoryKey: 'chat_history',
    inputKey: 'input',
  });
};
