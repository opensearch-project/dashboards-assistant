/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiIcon } from '@elastic/eui';
import React from 'react';
import { useChatContext } from '../contexts/chat_context';
import { ChatWindowHeaderTitle } from '../components/chat_window_header_title';
import chatIcon from '../assets/chat.svg';
import { TAB_ID } from '../utils/constants';

export interface ChatWindowHeaderProps {
  flyoutFullScreen: boolean;
  toggleFlyoutFullScreen: () => void;
}

export const ChatWindowHeader: React.FC<ChatWindowHeaderProps> = React.memo((props) => {
  const chatContext = useChatContext();

  const dockBottom = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path d="M3 1H13C14.1046 1 15 1.89543 15 3V13C15 14.1046 14.1046 15 13 15H3C1.89543 15 1 14.1046 1 13V3C1 1.89543 1.89543 1 3 1ZM3 2C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V3C14 2.44772 13.5523 2 13 2H3Z" />
        <path d="M3 9.5C3 9.22386 3.22386 9 3.5 9H12.5C12.7761 9 13 9.22386 13 9.5V12.5C13 12.7761 12.7761 13 12.5 13H3.5C3.22386 13 3 12.7761 3 12.5V9.5Z" />
      </g>
    </svg>
  );

  const dockRight = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path d="M3 1H13C14.1046 1 15 1.89543 15 3V13C15 14.1046 14.1046 15 13 15H3C1.89543 15 1 14.1046 1 13V3C1 1.89543 1.89543 1 3 1ZM3 2C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V3C14 2.44772 13.5523 2 13 2H3Z" />
        <path d="M9 3.5C9 3.22386 9.22386 3 9.5 3H12.5C12.7761 3 13 3.22386 13 3.5V12.5C13 12.7761 12.7761 13 12.5 13H9.5C9.22386 13 9 12.7761 9 12.5V3.5Z" />
      </g>
    </svg>
  );

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
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            aria-label="fullScreen"
            color="text"
            size="xs"
            // TODO replace svg with built-in icon
            iconType={props.flyoutFullScreen ? dockRight : dockBottom}
            onClick={props.toggleFlyoutFullScreen}
          />
        </EuiFlexItem>
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
