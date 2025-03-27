/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlyoutBody, EuiFlyoutFooter, EuiPage, EuiPageBody, EuiSpacer } from '@elastic/eui';
import React, { useCallback } from 'react';
import cs from 'classnames';
import { useObservable } from 'react-use';
import { useChatContext, useCore } from '../../contexts';
import { useChatState } from '../../hooks';
import { ChatPageContent } from './chat_page_content';
import { ChatInputControls } from './controls/chat_input_controls';

interface ChatPageProps {
  className?: string;
}

export const ChatPage: React.FC<ChatPageProps> = (props) => {
  const core = useCore();
  const chatContext = useChatContext();
  const { chatState, chatStateDispatch } = useChatState();
  const conversationLoadStatus = useObservable(core.services.conversationLoad.status$);
  const conversationsStatus = useObservable(core.services.conversations.status$);
  const messagesLoading = conversationLoadStatus === 'loading';
  const conversationsLoading = conversationsStatus === 'loading';

  const refreshConversation = useCallback(async () => {
    if (!chatContext.conversationId) {
      return;
    }
    const conversation = await core.services.conversationLoad.load(chatContext.conversationId);
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
  }, [chatContext.conversationId, chatStateDispatch]);

  const refreshConversationsList = useCallback(async () => {
    if (!chatContext.conversationId) {
      core.services.conversations
        .load({
          page: 1,
          perPage: 1,
          fields: ['createdTimeMs', 'updatedTimeMs', 'title'],
          sortField: 'updatedTimeMs',
          sortOrder: 'DESC',
          searchFields: ['title'],
        })
        .then(async () => {
          const data = core.services.conversations.conversations$.getValue();
          if (data?.objects?.length) {
            const { id } = data.objects[0];
            const conversation = await core.services.conversationLoad.load(id);
            if (conversation) {
              chatStateDispatch({
                type: 'receive',
                payload: {
                  messages: conversation.messages,
                  interactions: conversation.interactions,
                },
              });
            }
          }
        });
    }
  }, [chatStateDispatch]);

  return (
    <>
      <EuiFlyoutBody className={cs(props.className, 'llm-chat-flyout-body')}>
        <EuiPage paddingSize="s">
          <EuiPageBody component="div">
            <ChatPageContent
              messagesLoading={messagesLoading}
              conversationsLoading={conversationsLoading}
              messagesLoadingError={
                typeof conversationLoadStatus !== 'string'
                  ? conversationLoadStatus?.error
                  : undefined
              }
              conversationsError={
                typeof conversationsStatus !== 'string' ? conversationsStatus?.error : undefined
              }
              onRefreshConversation={refreshConversation}
              onRefreshConversationsList={refreshConversationsList}
            />
          </EuiPageBody>
        </EuiPage>
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiSpacer size="xs" />
        <ChatInputControls
          loading={chatState.llmResponding}
          disabled={messagesLoading || chatState.llmResponding}
        />
        <EuiSpacer size="m" />
      </EuiFlyoutFooter>
    </>
  );
};
