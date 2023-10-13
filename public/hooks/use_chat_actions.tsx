/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ASSISTANT_API } from '../../common/constants/llm';
import { IMessage, ISuggestedAction } from '../../common/types/chat_saved_object_attributes';
import { useChatContext } from '../contexts/chat_context';
import { useCore } from '../contexts/core_context';
import { AssistantActions } from '../types';
import { useChatState } from './use_chat_state';

interface SendResponse {
  sessionId: string;
  messages: IMessage[];
}

let abortControllerRef: AbortController;

export const useChatActions = (): AssistantActions => {
  const chatContext = useChatContext();
  const core = useCore();
  const { chatState, chatStateDispatch } = useChatState();

  const send = async (input: IMessage) => {
    const abortController = new AbortController();
    abortControllerRef = abortController;
    chatStateDispatch({ type: 'send', payload: input });
    try {
      const response = await core.services.http.post<SendResponse>(ASSISTANT_API.SEND_MESSAGE, {
        // do not send abort signal to http client to allow LLM call run in background
        body: JSON.stringify({
          sessionId: chatContext.sessionId,
          ...(!chatContext.sessionId && { messages: chatState.messages }), // include all previous messages for new chats
          input,
        }),
      });
      if (abortController.signal.aborted) return;
      chatContext.setSessionId(response.sessionId);
      chatStateDispatch({ type: 'receive', payload: response.messages });
    } catch (error) {
      if (abortController.signal.aborted) return;
      chatStateDispatch({ type: 'error', payload: error });
    }
  };

  const loadChat = (sessionId?: string) => {
    abortControllerRef?.abort();
    chatContext.setSessionId(sessionId);
    chatContext.setSelectedTabId('chat');
    if (!sessionId) chatStateDispatch({ type: 'reset' });
  };

  const openChatUI = () => {
    chatContext.setFlyoutVisible(true);
    chatContext.setSelectedTabId('chat');
  };

  const executeAction = async (suggestedAction: ISuggestedAction, message: IMessage) => {
    switch (suggestedAction.actionType) {
      case 'send_as_input': {
        send({
          type: 'input',
          content: suggestedAction.message,
          contentType: 'text',
        });
        break;
      }

      case 'view_in_dashboards': {
        const type = message.contentType;
        const id = message.content;
        switch (type) {
          case 'visualization':
            window.open(`./visualize#/edit/${id}`, '_blank');
            break;
        }
        break;
      }

      case 'view_ppl_visualization': {
        chatContext.actionExecutors[suggestedAction.actionType]?.({
          name: suggestedAction.metadata.question,
          query: suggestedAction.metadata.query,
        });
        break;
      }

      default:
        break;
    }
  };

  return { send, loadChat, executeAction, openChatUI };
};
