/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlyoutBody, EuiFlyoutFooter, EuiPage, EuiPageBody, EuiSpacer } from '@elastic/eui';
import React, { useCallback, useState } from 'react';
import cs from 'classnames';
import { useObservable } from 'react-use';
import { useChatContext } from '../../contexts/chat_context';
import { useChatState } from '../../hooks/use_chat_state';
import { ChatPageContent } from './chat_page_content';
import { ChatInputControls } from './controls/chat_input_controls';
import { useCore } from '../../contexts/core_context';

interface ChatPageProps {
  className?: string;
}

export const ChatPage: React.FC<ChatPageProps> = (props) => {
  const core = useCore();
  const chatContext = useChatContext();
  const { chatState, chatStateDispatch } = useChatState();
  const [showGreetings, setShowGreetings] = useState(false);
  const sessionLoadStatus = useObservable(core.services.sessionLoad.status$);
  const messagesLoading = sessionLoadStatus === 'loading';

  const refresh = useCallback(async () => {
    if (!chatContext.sessionId) {
      return;
    }
    const session = await core.services.sessionLoad.load(chatContext.sessionId);
    if (session) {
      chatStateDispatch({ type: 'receive', payload: session.messages });
    }
  }, [chatContext.sessionId, chatStateDispatch]);

  return (
    <>
      <EuiFlyoutBody className={cs(props.className, 'llm-chat-flyout-body')}>
        <EuiPage paddingSize="s">
          <EuiPageBody component="div">
            <ChatPageContent
              showGreetings={showGreetings}
              setShowGreetings={setShowGreetings}
              messagesLoading={messagesLoading}
              messagesLoadingError={
                typeof sessionLoadStatus !== 'string' ? sessionLoadStatus?.error : undefined
              }
              onRefresh={refresh}
            />
          </EuiPageBody>
        </EuiPage>
      </EuiFlyoutBody>
      <EuiFlyoutFooter className={props.className}>
        <EuiSpacer />
        <ChatInputControls
          loading={chatState.llmResponding}
          disabled={messagesLoading || chatState.llmResponding || !chatContext.userHasAccess}
        />
        <EuiSpacer />
      </EuiFlyoutFooter>
    </>
  );
};
