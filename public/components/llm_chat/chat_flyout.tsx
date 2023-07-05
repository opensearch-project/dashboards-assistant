/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlyout, EuiFlyoutHeader } from '@elastic/eui';
import cs from 'classnames';
import React, { useContext } from 'react';
import { ChatContext } from './chat_header_button';
import { ChatTabBar } from './components/chat_tab_bar';
import { ChatPage } from './tabs/chat/chat_page';
import { ChatHistoryPage } from './tabs/history/chat_history_page';

interface ChatFlyoutProps {
  flyoutVisible: boolean;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  overrideComponent: React.ReactNode | null;
  flyoutProps: Partial<React.ComponentProps<typeof EuiFlyout>>;
  flyoutFullScreen: boolean;
  toggleFlyoutFullScreen: () => void;
}

export const ChatFlyout: React.FC<ChatFlyoutProps> = (props) => {
  const chatContext = useContext(ChatContext)!;

  let chatPageVisible = false;
  let chatHistoryPageVisible = false;

  if (!props.overrideComponent) {
    switch (chatContext.selectedTabId) {
      case 'chat':
        chatPageVisible = true;
        break;

      case 'history':
        chatHistoryPageVisible = true;
        break;

      default:
        break;
    }
  }

  return (
    <EuiFlyout
      className={cs('llm-chat-flyout', {
        'llm-chat-fullscreen': props.flyoutFullScreen,
        'llm-chat-hidden': !props.flyoutVisible,
      })}
      type="push"
      paddingSize="none"
      size="460px"
      ownFocus={false}
      hideCloseButton
      onClose={() => chatContext.setFlyoutVisible(false)}
      {...props.flyoutProps}
    >
      <>
        {props.overrideComponent}
        <EuiFlyoutHeader
          className={cs('llm-chat-flyout-header', { 'llm-chat-hidden': props.overrideComponent })}
        >
          <ChatTabBar
            flyoutFullScreen={props.flyoutFullScreen}
            toggleFlyoutFullScreen={props.toggleFlyoutFullScreen}
          />
        </EuiFlyoutHeader>
        <ChatPage
          input={props.input}
          setInput={props.setInput}
          className={cs({ 'llm-chat-hidden': !chatPageVisible })}
        />
        {chatHistoryPageVisible && <ChatHistoryPage />}
      </>
    </EuiFlyout>
  );
};
