/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTab,
  EuiTabs,
} from '@elastic/eui';
import React, { useContext, useState } from 'react';
import { ChatContext } from '../chat_header_button';
import { useChatActions } from '../hooks/use_chat_actions';

export type TabId = 'chat' | 'compose' | 'insights' | 'history';

const tabs = [
  { id: 'chat', name: 'Chat' },
  { id: 'history', name: 'History' },
] as const;

export const ChatTabBar: React.FC = React.memo(() => {
  const chatContext = useContext(ChatContext)!;
  const { openChat } = useChatActions();
  const [isOpen, setIsOpen] = useState(false);
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
          iconType={chatContext.isFlyoutFullScreen ? 'fullScreenExit' : 'fullScreen'}
          onClick={chatContext.toggleFlyoutFullScreen}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false} />
    </EuiFlexGroup>
  );
});
