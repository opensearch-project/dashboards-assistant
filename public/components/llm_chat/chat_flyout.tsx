/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlyout, EuiFlyoutHeader } from '@elastic/eui';
import classNames from 'classnames';
import React, { useContext } from 'react';
import { ChatContext } from './chat_header_button';
import { ChatTabBar } from './components/chat_tab_bar';
import { ChatPage } from './tabs/chat/chat_page';
import { ChatHistoryPage } from './tabs/history/chat_history_page';

interface ChatFlyoutProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  overrideComponent: React.ReactNode | null;
  flyoutProps: Partial<React.ComponentProps<typeof EuiFlyout>>;
  isFlyoutFullScreen: boolean;
}

export const ChatFlyout: React.FC<ChatFlyoutProps> = (props) => {
  const chatContext = useContext(ChatContext)!;

  const contentStyle: React.CSSProperties | undefined = props.overrideComponent
    ? { display: 'none' }
    : undefined;

  let content = null;
  switch (chatContext.selectedTabId) {
    case 'chat':
      content = <ChatPage input={props.input} setInput={props.setInput} style={contentStyle} />;
      break;

    case 'history':
      content = <ChatHistoryPage style={contentStyle} />;
      break;

    default:
      break;
  }

  return (
    <EuiFlyout
      className={classNames('llm-chat-flyout', {
        'llm-chat-fullscreen': props.isFlyoutFullScreen,
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
        {/* @ts-ignore react version */}
        <EuiFlyoutHeader className="llm-chat-flyout-header" style={contentStyle}>
          <ChatTabBar />
        </EuiFlyoutHeader>
        {content}
      </>
    </EuiFlyout>
  );
};
