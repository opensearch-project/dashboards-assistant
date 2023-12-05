/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TAB_ID } from '../utils/constants';
import { ASSISTANT_API } from '../../common/constants/llm';
import {
  IMessage,
  ISuggestedAction,
  Interaction,
} from '../../common/types/chat_saved_object_attributes';
import { useChatContext } from '../contexts/chat_context';
import { useCore } from '../contexts/core_context';
import { AssistantActions } from '../types';
import { useChatState } from './use_chat_state';

interface SendResponse {
  conversationId: string;
  title: string;
  messages: IMessage[];
  interactions: Interaction[];
}

interface SetParagraphResponse {
  objectId: string;
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
          conversationId: chatContext.conversationId,
          rootAgentId: chatContext.rootAgentId,
          ...(!chatContext.conversationId && { messages: chatState.messages }), // include all previous messages for new chats
          input,
        }),
      });
      if (abortController.signal.aborted) return;
      // Refresh history list after new conversation created if new conversation saved and history list page visible
      if (
        !chatContext.conversationId &&
        response.conversationId &&
        core.services.conversations.options?.page === 1 &&
        chatContext.selectedTabId === TAB_ID.HISTORY
      ) {
        core.services.conversations.reload();
      }
      chatContext.setConversationId(response.conversationId);
      // set title for first time
      if (!chatContext.title) {
        chatContext.setTitle(response.title);
      }
      chatStateDispatch({
        type: 'receive',
        payload: {
          messages: response.messages,
          interactions: response.interactions,
        },
      });
    } catch (error) {
      if (abortController.signal.aborted) return;
      chatStateDispatch({ type: 'error', payload: error });
    }
  };

  const loadChat = async (conversationId?: string, title?: string) => {
    abortControllerRef?.abort();
    core.services.conversationLoad.abortController?.abort();
    chatContext.setConversationId(conversationId);
    chatContext.setTitle(title);
    // Chat page will always visible in fullscreen mode, we don't need to change the tab anymore
    if (!chatContext.flyoutFullScreen) {
      chatContext.setSelectedTabId(TAB_ID.CHAT);
    }
    chatContext.setFlyoutComponent(null);
    if (!conversationId) {
      chatStateDispatch({ type: 'reset' });
      return;
    }
    const conversation = await core.services.conversationLoad.load(conversationId);
    if (conversation) {
      chatStateDispatch({
        type: 'receive',
        payload: {
          messages: conversation.messages,
          interactions: conversation.interactions,
        },
      });
    }
  };

  const openChatUI = () => {
    chatContext.setFlyoutVisible(true);
    chatContext.setSelectedTabId(TAB_ID.CHAT);
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

      case 'view_trace':
        if ('traceId' in message) {
          chatContext.setSelectedTabId('trace');
          chatContext.setTraceId(message.traceId);
        }
        break;

      default:
        break;
    }
  };

  const abortAction = async (conversationId?: string) => {
    abortControllerRef.abort();
    chatStateDispatch({ type: 'abort' });

    if (conversationId) {
      // abort agent execution
      await core.services.http.post(`${ASSISTANT_API.ABORT_AGENT_EXECUTION}`, {
        body: JSON.stringify({ conversationId }),
      });
    }
  };

  const regenerate = async () => {
    if (chatContext.conversationId) {
      const abortController = new AbortController();
      abortControllerRef = abortController;
      chatStateDispatch({ type: 'regenerate' });

      try {
        const response = await core.services.http.put(`${ASSISTANT_API.REGENERATE}`, {
          body: JSON.stringify({ conversationId: chatContext.conversationId }),
        });

        if (abortController.signal.aborted) {
          return;
        }
        chatStateDispatch({
          type: 'receive',
          payload: {
            messages: response.messages,
            interactions: response.interactions,
          },
        });
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }
        chatStateDispatch({ type: 'error', payload: error });
      }
    }
  };

  return { send, loadChat, executeAction, openChatUI, abortAction, regenerate };
};
