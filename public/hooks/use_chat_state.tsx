/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { produce } from 'immer';
import React, { useContext, useMemo, useReducer } from 'react';
import { IMessage } from '../../common/types/chat_saved_object_attributes';

interface ChatState {
  messages: IMessage[];
  llmResponding: boolean;
  llmError?: Error;
}

type ChatStateAction =
  | { type: 'reset' }
  | { type: 'send'; payload: IMessage }
  | { type: 'receive'; payload: IMessage[] }
  | { type: 'error'; payload: Error };

interface IChatStateContext {
  chatState: ChatState;
  chatStateDispatch: React.Dispatch<ChatStateAction>;
}
const ChatStateContext = React.createContext<IChatStateContext | null>(null);

const initialState: ChatState = {
  messages: [
    {
      content: `Hello, I'm the Observability assistant.\n\nHow may I help you?`,
      contentType: 'markdown',
      type: 'output',
      suggestedActions: [
        { message: 'What are the indices in my cluster?', actionType: 'send_as_input' },
      ],
    },
  ],
  llmResponding: false,
};

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
        draft.messages = action.payload;
        draft.llmResponding = false;
        draft.llmError = undefined;
        break;

      case 'error':
        draft.llmResponding = false;
        draft.llmError = action.payload;
        break;
    }
  });

export const ChatStateProvider: React.FC = (props) => {
  const [chatState, chatStateDispatch] = useReducer(chatStateReducer, initialState);
  const contextValue: IChatStateContext = useMemo(() => ({ chatState, chatStateDispatch }), [
    chatState,
  ]);

  return (
    <ChatStateContext.Provider value={contextValue}>{props.children}</ChatStateContext.Provider>
  );
};

export const useChatState = () => useContext(ChatStateContext)!;
