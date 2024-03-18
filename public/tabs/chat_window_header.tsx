/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiIcon } from '@elastic/eui';
import React from 'react';
import { useChatContext } from '../contexts/chat_context';
import { ChatWindowHeaderTitle } from '../components/chat_window_header_title';
// TODO: Replace with getChrome().logos.Chat.url
import chatIcon from '../assets/chat.svg';
import { TAB_ID } from '../utils/constants';
import { SidecarIconMenu } from '../components/sidecar_icon_menu';

export const ChatWindowHeader = React.memo(() => {
  const chatContext = useChatContext();

  return (
    <>
      <EuiFlexGroup
        gutterSize="s"
        justifyContent="spaceAround"
        alignItems="center"
        responsive={false}
      >
        <EuiFlexItem>
          <EuiFlexGroup gutterSize="none" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false} style={{ marginLeft: '8px' }}>
              <EuiIcon type={chatIcon} size="m" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <ChatWindowHeaderTitle />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            aria-label="history"
            iconType="clock"
            size="xs"
            color="text"
            onClick={() => {
              chatContext.setFlyoutComponent(undefined);
              // Back to chat tab if history page already visible
              chatContext.setSelectedTabId(
                chatContext.selectedTabId === TAB_ID.HISTORY ? TAB_ID.CHAT : TAB_ID.HISTORY
              );
            }}
            display={chatContext.selectedTabId === TAB_ID.HISTORY ? 'fill' : undefined}
          />
        </EuiFlexItem>
        <SidecarIconMenu />
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            aria-label="close"
            size="xs"
            color="text"
            iconType="cross"
            onClick={() => {
              chatContext.setFlyoutVisible(false);
            }}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false} />
      </EuiFlexGroup>
    </>
  );
});
