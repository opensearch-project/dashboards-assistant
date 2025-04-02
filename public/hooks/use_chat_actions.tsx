/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { TAB_ID } from '../utils/constants';
import { ASSISTANT_API } from '../../common/constants/llm';
import { findLastIndex } from '../utils';
import {
  IMessage,
  ISuggestedAction,
  StreamChunk,
} from '../../common/types/chat_saved_object_attributes';
import { useChatContext } from '../contexts/chat_context';
import { useCore } from '../contexts/core_context';
import { AssistantActions } from '../types';
import { useChatState } from './use_chat_state';
import { useGetChunksFromHTTPResponse } from './use_get_chunks_from_http_response';

let abortControllerRef: AbortController;

export const useChatActions = (): AssistantActions => {
  const chatContext = useChatContext();
  const core = useCore();
  const { chatState, chatStateDispatch } = useChatState();
  const { getConsumedChunk$FromHttpResponse } = useGetChunksFromHTTPResponse();

  const send = (input: IMessage) =>
    new Promise(async (resolve) => {
      const abortController = new AbortController();
      abortControllerRef = abortController;
      chatStateDispatch({ type: 'send', payload: input });
      let chunk$ = new BehaviorSubject<StreamChunk | undefined>(undefined);
      try {
        const fetchResponse = await core.services.http.post(ASSISTANT_API.SEND_MESSAGE, {
          // do not send abort signal to http client to allow LLM call run in background
          body: JSON.stringify({
            conversationId: chatContext.conversationId,
            ...(!chatContext.conversationId && { messages: chatState.messages }), // include all previous messages for new chats
            input,
          }),
          query: core.services.dataSource.getDataSourceQuery(),
          asResponse: true,
        });
        chunk$ = await getConsumedChunk$FromHttpResponse({
          fetchResponse,
          abortController,
        });
      } catch (error) {
        resolve(undefined);
        if (abortController.signal.aborted) {
          return;
        }
        chatStateDispatch({ type: 'error', payload: error });
      }

      chunk$.subscribe(
        (chunk) => {
          if (chunk) {
            if (chunk.type === 'metadata') {
              const { body } = chunk;
              // Refresh history list after new conversation created if new conversation saved and history list page visible
              if (
                !chatContext.conversationId &&
                body.conversationId &&
                core.services.conversations.options?.page === 1 &&
                chatContext.selectedTabId === TAB_ID.HISTORY
              ) {
                core.services.conversations.reload();
              }
              if (body.conversationId) {
                chatContext.setConversationId(body.conversationId);
              }

              // set title for first time
              if (body.title && !chatContext.title) {
                chatContext.setTitle(body.title);
              }

              if (body.messages?.length && body.interactions?.length) {
                /**
                 * Remove messages that do not have messageId
                 * because they are used for displaying loading state
                 */
                chatStateDispatch({
                  type: 'receive',
                  payload: {
                    messages: chatState.messages.filter((item) => item.messageId),
                    interactions: chatState.interactions,
                  },
                });

                /**
                 * Patch messages and interactions based on backend response
                 */
                chatStateDispatch({
                  type: 'patch',
                  payload: {
                    messages: body.messages,
                    interactions: body.interactions,
                  },
                });
              }
            }
          }
        },
        () => {
          resolve(undefined);
        },
        () => {
          resolve(undefined);
        }
      );
    });
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

      chatStateDispatch({
        type: 'llmRespondingChange',
        payload: {
          flag: false,
        },
      });
    }
  };

  const resetChat = () => {
    abortControllerRef?.abort();
    core.services.conversationLoad.abortController?.abort();
    chatContext.setConversationId(undefined);
    chatContext.setTitle(undefined);
    chatContext.setFlyoutComponent(null);
    chatStateDispatch({ type: 'reset' });
  };

  const openChatUI = () => {
    chatContext.setFlyoutVisible(true);
    chatContext.setSelectedTabId(TAB_ID.CHAT);
  };

  const executeAction = async (suggestedAction: ISuggestedAction, message: IMessage) => {
    switch (suggestedAction.actionType) {
      case 'send_as_input': {
        await send({
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
        if ('interactionId' in message) {
          if (chatContext.selectedTabId !== TAB_ID.TRACE) {
            chatContext.setSelectedTabId(TAB_ID.TRACE);
          }
          chatContext.setInteractionId(message.interactionId);
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
        query: core.services.dataSource.getDataSourceQuery(),
      });
    }
  };

  const regenerate = async (interactionId: string) => {
    if (chatContext.conversationId) {
      const abortController = new AbortController();
      abortControllerRef = abortController;
      let chunk$ = new BehaviorSubject<StreamChunk | undefined>(undefined);
      chatStateDispatch({ type: 'regenerate' });

      try {
        const fetchResponse = await core.services.http.put(`${ASSISTANT_API.REGENERATE}`, {
          body: JSON.stringify({
            conversationId: chatContext.conversationId,
            interactionId,
          }),
          query: core.services.dataSource.getDataSourceQuery(),
          asResponse: true,
          pureFetch: true,
        });

        chunk$ = await getConsumedChunk$FromHttpResponse({
          fetchResponse,
          abortController,
        });

        chunk$.subscribe((chunk) => {
          if (chunk) {
            if (chunk.type === 'metadata') {
              const findRegeratedMessageIndex = findLastIndex(
                chatState.messages,
                (message) => message.type === 'input'
              );
              /**
               * Remove the regenerated interaction & message.
               * In implementation of Agent framework, it will generate a new interactionId
               * so need to remove the staled interaction in Frontend manually.
               * And chatStateDispatch({ type: 'receive' }) here is used to delete the input message
               */
              if (findRegeratedMessageIndex > -1) {
                chatStateDispatch({
                  type: 'receive',
                  payload: {
                    messages: [
                      ...chatState.messages
                        .slice(0, findRegeratedMessageIndex)
                        .filter((item) => item.messageId),
                      ...(chunk.body.messages || []),
                    ],
                    interactions: [
                      ...chatState.interactions.filter(
                        (interaction) => interaction.interaction_id !== interactionId
                      ),
                      ...(chunk.body.interactions || []),
                    ],
                  },
                });
              }
            }
          }
        });
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }
        chatStateDispatch({ type: 'error', payload: error });
      }
    }
  };

  return { send, loadChat, resetChat, executeAction, openChatUI, abortAction, regenerate };
};
