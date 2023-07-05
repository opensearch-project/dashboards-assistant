/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext } from 'react';
import { toMountPoint } from '../../../../../../src/plugins/opensearch_dashboards_react/public';
import { CHAT_API } from '../../../../common/constants/llm';
import {
  IMessage,
  ISuggestedAction,
} from '../../../../common/types/observability_saved_object_attributes';
import {
  PPLSavedQueryClient,
  PPLSavedVisualizationClient,
} from '../../../services/saved_objects/saved_object_client/ppl';
import { ChatContext, CoreServicesContext } from '../chat_header_button';
import { PPLVisualizationModal } from '../components/ppl_visualization_modal';
import { useChatState } from './use_chat_state';

interface SendResponse {
  chatId: string;
  messages: IMessage[];
}

let abortControllerRef: AbortController;

// TODO refactor into different hooks
export const useChatActions = () => {
  const chatContext = useContext(ChatContext)!;
  const coreServicesContext = useContext(CoreServicesContext)!;
  const { chatState, chatStateDispatch } = useChatState();

  const send = async (input: IMessage) => {
    const abortController = new AbortController();
    abortControllerRef = abortController;
    chatStateDispatch({ type: 'send', payload: input });
    try {
      const response = await coreServicesContext.http.post<SendResponse>(CHAT_API.LLM, {
        body: JSON.stringify({
          chatId: chatContext.chatId,
          messages: chatState.messages,
          input,
        }),
      });
      if (abortController.signal.aborted) return;
      chatContext.setChatId(response.chatId);
      chatStateDispatch({ type: 'receive', payload: response.messages });
    } catch (error) {
      if (abortController.signal.aborted) return;
      chatStateDispatch({ type: 'error', payload: error as Error });
    }
  };

  const openChat = (chatId?: string) => {
    abortControllerRef?.abort();
    chatContext.setChatId(chatId);
    chatContext.setSelectedTabId('chat');
    if (!chatId) chatStateDispatch({ type: 'reset' });
  };

  const executeAction = async (suggestAction: ISuggestedAction, message: IMessage) => {
    switch (suggestAction.actionType) {
      case 'send_as_input': {
        send({
          type: 'input',
          content: suggestAction.message,
          contentType: 'text',
        });
        break;
      }

      case 'save_and_view_ppl_query': {
        const saveQueryResponse = await savePPLQuery(suggestAction.metadata.query);
        coreServicesContext.core.application.navigateToUrl(
          `/app/observability-logs#/explorer/${saveQueryResponse.objectId}`
        );
        break;
      }

      case 'view_ppl_visualization': {
        const modal = coreServicesContext.core.overlays.openModal(
          toMountPoint(
            <PPLVisualizationModal
              query={suggestAction.metadata.query}
              onConfirm={async () => {
                const saveVisualizationResponse = await savePPLVisualization(
                  suggestAction.metadata.query
                );
                modal.close();
                coreServicesContext.core.application.navigateToUrl(
                  `/app/observability-logs#/explorer/${saveVisualizationResponse.objectId}`
                );
              }}
              onClose={() => modal.close()}
            />
          )
        );
        break;
      }

      default:
        break;
    }
  };

  return { send, openChat, executeAction };
};

const savePPLQuery = (query: string) => {
  return PPLSavedQueryClient.getInstance().create({
    query,
    name: query.slice(0, 50),
    dateRange: ['now-5y', 'now'],
    fields: [],
    timestamp: '',
  });
};

const savePPLVisualization = (query: string) => {
  const savedVisualization = {
    query,
    name: query.slice(0, 50),
    dateRange: ['now-14d', 'now'],
    fields: [],
    timestamp: '',
    type: 'line',
    sub_type: 'visualization',
  };
  // @ts-ignore not sure what is required but this works
  return PPLSavedVisualizationClient.getInstance().create(savedVisualization);
};
