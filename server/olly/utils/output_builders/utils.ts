/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mergeWith } from 'lodash';
import { IMessage } from '../../../../common/types/chat_saved_object_attributes';
import { LangchainTrace } from '../../../../common/utils/llm_chat/traces';

type RequiredKey<T, K extends keyof T> = T & Required<Pick<T, K>>;

export const filterToolOutput = (toolName: string) => {
  return (trace: LangchainTrace): trace is RequiredKey<typeof trace, 'output'> =>
    trace.type === 'tool' &&
    trace.name === toolName &&
    trace.output !== null &&
    trace.output !== undefined;
};

/**
 * Merges a list of partial messages into a given IMessage object.
 * @returns merged
 */
export const mergeMessages = (message: IMessage, ...messages: Array<Partial<IMessage>>) => {
  return mergeWith(
    message,
    ...messages,
    (obj: IMessage[keyof IMessage], src: IMessage[keyof IMessage]) => {
      if (Array.isArray(obj)) return obj.concat(src);
    }
  ) as IMessage;
};
