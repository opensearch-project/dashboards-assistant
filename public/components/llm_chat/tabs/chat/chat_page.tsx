/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlyoutBody, EuiFlyoutFooter, EuiPage, EuiPageBody, EuiSpacer } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { useChatState } from '../../hooks/use_chat_state';
import { useGetChat } from '../../hooks/use_get_chat';
import { ChatInputControls } from './chat_input_controls';
import { ChatPageContent } from './chat_page_content';

interface ChatPageProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  className?: string;
}

export const ChatPage: React.FC<ChatPageProps> = (props) => {
  const { chatState, chatStateDispatch } = useChatState();
  const [showGreetings, setShowGreetings] = useState(true);
  const { data: chat, loading: messagesLoading, error: messagesLoadingError } = useGetChat();

  useEffect(() => {
    if (chat) {
      chatStateDispatch({ type: 'receive', payload: chat.attributes.messages });
    }
  }, [chat]);

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
        <ChatInputControls disabled={messagesLoading || chatState.llmResponding} input={props.input} setInput={props.setInput} />
        <EuiSpacer />
      </EuiFlyoutFooter>
    </>
  );
};
