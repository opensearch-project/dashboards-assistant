/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlyout, EuiFlyoutHeader } from '@elastic/eui';
import cs from 'classnames';
import React from 'react';
import { useChatContext } from './contexts/chat_context';
import { ChatPage } from './tabs/chat/chat_page';
import { ChatWindowHeader } from './tabs/chat_window_header';
import { ChatHistoryPage } from './tabs/history/chat_history_page';

let chatHistoryPageLoaded = false;

interface ChatFlyoutProps {
  flyoutVisible: boolean;
  overrideComponent: React.ReactNode | null;
  flyoutProps: Partial<React.ComponentProps<typeof EuiFlyout>>;
  flyoutFullScreen: boolean;
  toggleFlyoutFullScreen: () => void;
}

export const ChatFlyout: React.FC<ChatFlyoutProps> = (props) => {
  const chatContext = useChatContext();

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

  if (!chatHistoryPageLoaded && chatHistoryPageVisible) chatHistoryPageLoaded = true;

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
        <EuiFlyoutHeader className={cs('llm-chat-flyout-header')}>
          <ChatWindowHeader
            flyoutFullScreen={props.flyoutFullScreen}
            toggleFlyoutFullScreen={props.toggleFlyoutFullScreen}
          />
        </EuiFlyoutHeader>

        {props.overrideComponent}

        <ChatPage className={cs({ 'llm-chat-hidden': !chatPageVisible })} />

        {chatHistoryPageLoaded && (
          <ChatHistoryPage
            className={cs({ 'llm-chat-hidden': !chatHistoryPageVisible })}
            // refresh data when user switched to table from another tab
            shouldRefresh={chatHistoryPageVisible}
          />
        )}
      </>
    </EuiFlyout>
  );
};
