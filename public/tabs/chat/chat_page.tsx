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
  const conversationsStatus = useObservable(
    core.services.conversationLoad.conversationsService.status$
  );
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
  }, [chatContext.conversationId, chatStateDispatch, core.services.conversationLoad]);

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
      core.services.conversationLoad.getLatestConversationId().then(async (conversationId) => {
        if (conversationId) {
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
        }
      });
    }
  }, [chatStateDispatch, core.services.conversationLoad]);

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
