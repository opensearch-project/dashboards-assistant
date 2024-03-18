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
  const messagesLoading = conversationLoadStatus === 'loading';

  const refresh = useCallback(async () => {
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

  return (
    <>
      <EuiFlyoutBody className={cs(props.className, 'llm-chat-flyout-body')}>
        <EuiPage paddingSize="s">
          <EuiPageBody component="div">
            <ChatPageContent
              messagesLoading={messagesLoading}
              messagesLoadingError={
                typeof conversationLoadStatus !== 'string'
                  ? conversationLoadStatus?.error
                  : undefined
              }
              onRefresh={refresh}
            />
          </EuiPageBody>
        </EuiPage>
      </EuiFlyoutBody>
      <EuiFlyoutFooter className="llm-chat-flyout-footer">
        <EuiSpacer size="xs" />
        <ChatInputControls
          loading={chatState.llmResponding}
          disabled={messagesLoading || chatState.llmResponding || !chatContext.userHasAccess}
        />
        <EuiSpacer size="s" />
      </EuiFlyoutFooter>
    </>
  );
};
