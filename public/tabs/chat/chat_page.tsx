/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlyoutBody, EuiFlyoutFooter, EuiPage, EuiPageBody, EuiSpacer } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { useChatContext } from '../../contexts/chat_context';
import { useChatState } from '../../hooks/use_chat_state';
import { useGetSession } from '../../hooks/use_sessions';
import { ChatPageContent } from './chat_page_content';
import { ChatInputControls } from './controls/chat_input_controls';

interface ChatPageProps {
  className?: string;
}

export const ChatPage: React.FC<ChatPageProps> = (props) => {
  const chatContext = useChatContext();
  const { chatState, chatStateDispatch } = useChatState();
  const [showGreetings, setShowGreetings] = useState(true);
  const { data: session, loading: messagesLoading, error: messagesLoadingError } = useGetSession();

  useEffect(() => {
    if (session) {
      chatStateDispatch({ type: 'receive', payload: session.messages });
    }
  }, [session]);

  return (
    <>
      <EuiFlyoutBody className={props.className}>
        <EuiPage>
          <EuiPageBody component="div">
            <ChatPageContent
              showGreetings={showGreetings}
              setShowGreetings={setShowGreetings}
              messagesLoading={messagesLoading}
              messagesLoadingError={messagesLoadingError}
            />
          </EuiPageBody>
        </EuiPage>
      </EuiFlyoutBody>
      <EuiFlyoutFooter className={props.className}>
        <EuiSpacer />
        <ChatInputControls
          disabled={messagesLoading || chatState.llmResponding || !chatContext.chatEnabled}
        />
        <EuiSpacer />
      </EuiFlyoutFooter>
    </>
  );
};
