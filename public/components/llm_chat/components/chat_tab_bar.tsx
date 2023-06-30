/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTab,
  EuiTabs,
} from '@elastic/eui';
import React, { useContext } from 'react';
import { ChatContext } from '../chat_header_button';
import { useChatActions } from '../hooks/use_chat_actions';

export type TabId = 'chat' | 'compose' | 'insights' | 'history';

const tabs = [
  { id: 'chat', name: 'Chat' },
  { id: 'history', name: 'History' },
] as const;

interface ChatTabBarProps {
  flyoutFullScreen: boolean;
  toggleFlyoutFullScreen: () => void;
}

export const ChatTabBar: React.FC<ChatTabBarProps> = React.memo((props) => {
  const chatContext = useContext(ChatContext)!;
  const { openChat } = useChatActions();
  const tabsComponent = tabs.map((tab) => (
    <EuiTab
      onClick={() => chatContext.setSelectedTabId(tab.id)}
      isSelected={tab.id === chatContext.selectedTabId}
      key={tab.id}
    >
      {tab.name}
    </EuiTab>
  ));

  return (
    <EuiFlexGroup gutterSize="s" justifyContent="spaceBetween" alignItems="center">
      <EuiFlexItem>
        <EuiTabs className="llm-chat-tabs">{tabsComponent}</EuiTabs>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty size="s" onClick={() => openChat(undefined)}>
          New chat
        </EuiButtonEmpty>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          aria-label="fullScreen"
          size="s"
          iconType={props.flyoutFullScreen ? 'fullScreenExit' : 'fullScreen'}
          onClick={props.toggleFlyoutFullScreen}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false} />
    </EuiFlexGroup>
  );
});
