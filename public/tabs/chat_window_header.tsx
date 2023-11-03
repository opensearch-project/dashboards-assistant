/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
} from '@elastic/eui';
import React, { useState } from 'react';
import { useChatContext } from '../contexts/chat_context';
import { useChatActions } from '../hooks/use_chat_actions';

interface ChatWindowHeaderProps {
  flyoutFullScreen: boolean;
  toggleFlyoutFullScreen: () => void;
}

export const ChatWindowHeader: React.FC<ChatWindowHeaderProps> = React.memo((props) => {
  const chatContext = useChatContext();
  const { loadChat } = useChatActions();
  const [isPopoverOpen, setPopover] = useState(false);

  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const dockBottom = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <g fill="currentColor">
        <path d="M0 1.99406C0 0.892771 0.894514 0 1.99406 0H14.0059C15.1072 0 16 0.894514 16 1.99406V14.0059C16 15.1072 15.1055 16 14.0059 16H1.99406C0.892771 16 0 15.1055 0 14.0059V1.99406ZM1 1.99406V14.0059C1 14.5539 1.44579 15 1.99406 15H14.0059C14.5539 15 15 14.5542 15 14.0059V1.99406C15 1.44606 14.5542 1 14.0059 1H1.99406C1.44606 1 1 1.44579 1 1.99406Z" />
        <rect x="0.5" y="15" width="9.5" height="15" transform="rotate(-90 0.5 15)" />
      </g>
    </svg>
  );

  const dockRight = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path d="M0 1.99406C0 0.892771 0.894514 0 1.99406 0H14.0059C15.1072 0 16 0.894514 16 1.99406V14.0059C16 15.1072 15.1055 16 14.0059 16H1.99406C0.892771 16 0 15.1055 0 14.0059V1.99406ZM1 1.99406V14.0059C1 14.5539 1.44579 15 1.99406 15H14.0059C14.5539 15 15 14.5542 15 14.0059V1.99406C15 1.44606 14.5542 1 14.0059 1H1.99406C1.44606 1 1 1.44579 1 1.99406Z" />
        <rect x="9" y="0.5" width="6" height="14.5" />
      </g>
    </svg>
  );

  const button = (
    <EuiButtonEmpty
      style={{ maxWidth: '300px' }}
      size="s"
      iconType="arrowDown"
      iconSide="right"
      onClick={onButtonClick}
    >
      <span className="eui-textTruncate">{chatContext.title || 'OpenSearch Assistant'}</span>
    </EuiButtonEmpty>
  );

  const items = [
    <EuiContextMenuItem
      key="rename-conversation"
      onClick={() => {
        closePopover();
      }}
    >
      Rename conversation
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="new-conversation"
      onClick={() => {
        closePopover();
        loadChat(undefined);
      }}
    >
      New conversation
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="save-as-notebook"
      onClick={() => {
        closePopover();
      }}
    >
      Save as notebook
    </EuiContextMenuItem>,
  ];

  return (
    <EuiFlexGroup gutterSize="s" justifyContent="spaceAround" alignItems="center">
      <EuiFlexItem>
        <EuiFlexGroup gutterSize="none" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiPopover
              id="conversationTitle"
              button={button}
              isOpen={isPopoverOpen}
              closePopover={closePopover}
              panelPaddingSize="none"
              anchorPosition="downRight"
            >
              <EuiContextMenuPanel size="m" items={items} />
            </EuiPopover>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              aria-label="history"
              iconType="clock"
              size="m"
              onClick={() => {
                chatContext.setSelectedTabId('history');
              }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          aria-label="fullScreen"
          size="s"
          // TODO replace svg with built-in icon
          iconType={props.flyoutFullScreen ? dockRight : dockBottom}
          onClick={props.toggleFlyoutFullScreen}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          aria-label="close"
          size="s"
          iconType="cross"
          onClick={() => {
            chatContext.setFlyoutVisible(false);
          }}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false} />
    </EuiFlexGroup>
  );
});
