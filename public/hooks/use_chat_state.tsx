/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { produce } from 'immer';
import React, { useContext, useMemo, useReducer } from 'react';
import { IMessage, Interaction, IOutput } from '../../common/types/chat_saved_object_attributes';
import { findLastIndex } from '../utils';

export interface ChatState {
  messages: IMessage[];
  interactions: Interaction[];
  llmResponding: boolean;
  llmError?: Error;
  nextToken?: string;
  llmResponseType?: LLMResponseType;
}

export enum LLMResponseType {
  TEXT = 'text',
  STREAMING = 'streaming',
}

type ChatStateAction =
  | { type: 'regenerate' }
  | { type: 'abort' }
  | { type: 'reset' }
  | { type: 'send'; payload: IMessage }
  | {
      type: 'receive';
      payload: {
        messages: ChatState['messages'];
        interactions: ChatState['interactions'];
        nextToken?: ChatState['nextToken'];
      };
    }
  | {
      type: 'error';
      payload: NonNullable<ChatState['llmError']> | { body: NonNullable<ChatState['llmError']> };
    }
  | {
      type: 'patch';
      payload: {
        messages: ChatState['messages'];
        interactions: ChatState['interactions'];
        nextToken?: ChatState['nextToken'];
      };
    }
  | {
      type: 'llmRespondingChange';
      payload: {
        flag: boolean;
      };
    }
  | {
      type: 'updateResponseType';
      payload: {
        type: LLMResponseType;
      };
    }
  | {
      type: 'appendMessageContent';
      payload: {
        content: string;
        messageId: string;
      };
    }
  | {
      type: 'updateOutputMessage';
      payload: {
        messageId: string;
        payload: Partial<Omit<IOutput, 'messageId'>>;
      };
    };

interface IChatStateContext {
  chatState: ChatState;
  chatStateDispatch: React.Dispatch<ChatStateAction>;
}
const ChatStateContext = React.createContext<IChatStateContext | null>(null);

const initialState: ChatState = {
  interactions: [],
  messages: [],
  llmResponding: false,
  llmResponseType: LLMResponseType.TEXT,
};

/**
 * This function will try to patch the matched item from patchArray into arrayWaitForPatch,
 * and append all the items that not matched into arrayWaitForPatch.
 * @param arrayWaitForPatch T[] the array wait for patch
 * @param patchArray T[] the array contains patch
 * @param primaryKey the field used to find match item_from_arrayWaitForPatch[primaryKey] === patchArray[primaryKey]
 */
export function addPatchInArray<T>(arrayWaitForPatch: T[], patchArray: T[], primaryKey: keyof T) {
  const notMatchArray: T[] = [];
  const copiedArrayWaitForPatch = [...arrayWaitForPatch];
  patchArray.forEach((patchItem) => {
    const findIndex = copiedArrayWaitForPatch.findIndex(
      (itemInWaitForPatch) => itemInWaitForPatch[primaryKey] === patchItem[primaryKey]
    );
    if (findIndex > -1) {
      copiedArrayWaitForPatch[findIndex] = {
        ...copiedArrayWaitForPatch[findIndex],
        ...patchItem,
      };
    } else {
      notMatchArray.push(patchItem);
    }
  });

  return [...copiedArrayWaitForPatch, ...notMatchArray];
}

const chatStateReducer: React.Reducer<ChatState, ChatStateAction> = (state, action) =>
  produce(state, (draft) => {
    switch (action.type) {
      case 'reset':
        return initialState;

      case 'send':
        draft.messages.push(action.payload);
        draft.llmResponding = true;
        draft.llmError = undefined;
        break;

      case 'receive':
        if (draft.nextToken) {
          draft.messages = action.payload.messages.concat(state.messages);
        } else {
          draft.messages = action.payload.messages;
        }
        draft.interactions = action.payload.interactions;
        draft.llmError = undefined;
        draft.nextToken = action.payload.nextToken;
        break;

      case 'error':
        draft.llmResponding = false;
        draft.llmError = 'body' in action.payload ? action.payload.body : action.payload;
        break;
      case 'abort':
        draft.llmResponding = false;
        break;
      case 'regenerate':
        const lastInputIndex = findLastIndex(draft.messages, (msg) => msg.type === 'input');
        // Exclude the last outputs
        draft.messages = draft.messages.slice(0, lastInputIndex + 1);
        draft.llmResponding = true;
        draft.llmError = undefined;
        break;
      /**
       * As in Olly, regenerate and send_message API will only response with the latest one interaction and messages to improve performance.
       * So we need to use patch to hanlde with the response.
       */
      case 'patch':
        draft.messages = addPatchInArray(state.messages, action.payload.messages, 'messageId');
        draft.interactions = addPatchInArray(
          state.interactions,
          action.payload.interactions,
          'interaction_id'
        );
        draft.llmError = undefined;
        break;

      case 'appendMessageContent':
        const updatingMessage = state.messages.find(
          (message) => message.messageId === action.payload.messageId
        );
        if (updatingMessage) {
          const patchMessages: IMessage[] = [
            {
              ...updatingMessage,
              content: updatingMessage.content + action.payload.content,
            },
          ];
          draft.messages = addPatchInArray(state.messages, patchMessages, 'messageId');
        }
        break;

      case 'updateOutputMessage':
        const messageForUpdate = state.messages.find(
          (message) => message.messageId === action.payload.messageId
        );
        if (messageForUpdate) {
          const patchMessages: IOutput[] = [
            {
              ...messageForUpdate,
              ...action.payload.payload,
            } as IOutput,
          ];
          draft.messages = addPatchInArray(state.messages, patchMessages, 'messageId');
        }
        break;

      case 'llmRespondingChange':
        draft.llmResponding = action.payload.flag;
        break;

      case 'updateResponseType':
        draft.llmResponseType = action.payload.type;
        break;
    }
  });

export const ChatStateProvider = (props: { children?: React.ReactNode }) => {
  const [chatState, chatStateDispatch] = useReducer(chatStateReducer, initialState);
  const contextValue: IChatStateContext = useMemo(() => ({ chatState, chatStateDispatch }), [
    chatState,
  ]);

  return (
    <ChatStateContext.Provider value={contextValue}>{props.children}</ChatStateContext.Provider>
  );
};

export const useChatState = () => useContext(ChatStateContext)!;
