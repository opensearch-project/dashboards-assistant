/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlyoutBody, EuiFlyoutFooter, EuiPage, EuiPageBody, EuiSpacer } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import cs from 'classnames';
import { useObservable } from 'react-use';
import { useChatContext } from '../../contexts/chat_context';
import { useChatState } from '../../hooks/use_chat_state';
import { useGetSession } from '../../hooks/use_sessions';
import { ChatPageContent } from './chat_page_content';
import { ChatInputControls } from './controls/chat_input_controls';
import { SavedObjectManager } from '../../services/saved_object_manager';
import { useCore } from '../../contexts/core_context';
import { CHAT_CONFIG_SAVED_OBJECT_TYPE } from '../../../common/constants/saved_objects';
import { ChatConfig } from '../../types';

interface ChatPageProps {
  className?: string;
}

export const ChatPage: React.FC<ChatPageProps> = (props) => {
  const core = useCore();
  const chatConfigService = SavedObjectManager.getInstance<ChatConfig>(
    core.services.savedObjects.client,
    CHAT_CONFIG_SAVED_OBJECT_TYPE
  );
  const chatContext = useChatContext();
  const { chatState, chatStateDispatch } = useChatState();
  const [showGreetings, setShowGreetings] = useState(false);
  const { data: session, loading: messagesLoading, error: messagesLoadingError } = useGetSession();
  const chatConfig = useObservable(chatConfigService.get$(chatContext.currentAccount.username));
  const termsAccepted = Boolean(chatConfig?.terms_accepted);

  useEffect(() => {
    if (session) {
      chatStateDispatch({ type: 'receive', payload: session.messages });
    }
  }, [session]);

  return (
    <>
      <EuiFlyoutBody className={cs(props.className, 'llm-chat-flyout-body')}>
        <EuiPage style={{ background: 'transparent' }}>
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
          disabled={
            messagesLoading || chatState.llmResponding || !chatContext.chatEnabled || !termsAccepted
          }
        />
        <EuiSpacer />
      </EuiFlyoutFooter>
    </>
  );
};
