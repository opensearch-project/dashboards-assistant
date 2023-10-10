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
import React from 'react';
import { useChatContext } from '../contexts/chat_context';
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
  const chatContext = useChatContext();
  const { loadChat } = useChatActions();
  const tabsComponent = tabs.map((tab) => (
    <EuiTab
      onClick={() => chatContext.setSelectedTabId(tab.id)}
      isSelected={tab.id === chatContext.selectedTabId}
      key={tab.id}
      disabled={!chatContext.chatEnabled}
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
        <EuiButtonEmpty size="s" onClick={() => loadChat(undefined)}>
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
