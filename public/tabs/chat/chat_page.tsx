/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlyoutBody, EuiFlyoutFooter, EuiPage, EuiPageBody, EuiSpacer } from '@elastic/eui';
import React, { useCallback, useRef } from 'react';
import cs from 'classnames';
import { useObservable } from 'react-use';
import { useChatContext, useCore } from '../../contexts';
import { useChatState, useChatActions } from '../../hooks';
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
    }
  }, [chatContext.conversationId, chatStateDispatch]);

  const { loadChat } = useChatActions();
  const chatScrollTopRef = useRef<{ scrollTop: number; height: number } | null>(null);
  const handleScroll = async (event: React.UIEvent<HTMLElement>) => {
    const scrollTop = event.target.scrollTop;
    if (!messagesLoading && chatState?.nextToken && chatState?.nextToken !== '') {
      if (scrollTop < 150) {
        const html = event.target;
        chatScrollTopRef.current = { scrollTop, height: html.scrollHeight };
        await loadChat(chatContext.conversationId, chatState.nextToken);
        html.scrollTop = html.scrollHeight - chatScrollTopRef.current.height;
        chatScrollTopRef.current = null;
      }
    }
  };
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
      <EuiFlyoutBody
        className={cs(props.className, 'llm-chat-flyout-body')}
        onScroll={handleScroll}
      >
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
              chatScrollTopRef={chatScrollTopRef}
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
