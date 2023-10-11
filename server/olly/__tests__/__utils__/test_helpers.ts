/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IMessage } from '../../../../common/types/chat_saved_object_attributes';
import { LangchainTrace } from '../../../../common/utils/llm_chat/traces';

export const createTrace = (options: Partial<LangchainTrace> = {}): LangchainTrace => ({
  id: 'trace-id',
  type: 'chain',
  startTime: 0,
  name: 'trace name',
  input: 'input',
  output: 'output',
  ...options,
});

export const createMessage = (options: Partial<IMessage> = {}): IMessage => {
  if (options.type === 'input') {
    return {
      type: 'input',
      content: 'user input',
      contentType: 'text',
      ...options,
    };
  }

  return {
    type: 'output',
    content: 'assistant output',
    contentType: 'markdown',
    traceID: 'session-id',
    ...options,
  } as IMessage;
};
