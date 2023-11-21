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
  EuiIcon,
} from '@elastic/eui';
import React, { useCallback, useState } from 'react';
import { EditConversationNameModal } from '../components/edit_conversation_name_modal';
import { useChatContext } from '../contexts/chat_context';
import { useChatActions } from '../hooks/use_chat_actions';
import { NotebookNameModal } from '../components/notebook/notebook_name_modal';
import { useCore } from '../contexts/core_context';
import { useChatState } from '../hooks/use_chat_state';
import { useSaveChat } from '../hooks/use_save_chat';
import chatIcon from '../assets/chat.svg';
interface ChatWindowHeaderProps {
  flyoutFullScreen: boolean;
  toggleFlyoutFullScreen: () => void;
}

export const ChatWindowHeader: React.FC<ChatWindowHeaderProps> = React.memo((props) => {
  const chatContext = useChatContext();
  const { loadChat } = useChatActions();
  const core = useCore();
  const [isPopoverOpen, setPopover] = useState(false);
  const [isRenameModelOpen, setRenameModelOpen] = useState(false);
  const { chatState } = useChatState();
  const { saveChat } = useSaveChat();

  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const handleEditConversationClose = useCallback(
    (status: 'updated' | string, newTitle?: string) => {
      if (status === 'updated') {
        chatContext.setTitle(newTitle);
      }
      setRenameModelOpen(false);
    },
    [chatContext]
  );

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

  const button = (
    <EuiButtonEmpty
      style={{ maxWidth: '300px' }}
      size="s"
      color="text"
      iconType="arrowDown"
      iconSide="right"
      onClick={onButtonClick}
    >
      <h3 className="eui-textTruncate">
        {chatContext.sessionId ? chatContext.title : 'OpenSearch Assistant'}
      </h3>
    </EuiButtonEmpty>
  );

  const items = [
    <EuiContextMenuItem
      disabled={!chatContext.sessionId}
      key="rename-conversation"
      onClick={() => {
        closePopover();
        setRenameModelOpen(true);
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
        const modal = core.overlays.openModal(
          <NotebookNameModal onClose={() => modal.close()} saveChat={saveChat} />
        );
        closePopover();
      }}
      // User only can save conversation when he send a message at least.
      disabled={chatState.messages.filter((item) => item.type === 'input').length < 1}
    >
      Save to notebook
    </EuiContextMenuItem>,
  ];

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
                size="xs"
                color="text"
                onClick={() => {
                  chatContext.setFlyoutComponent(undefined);
                  // Back to chat tab if history page already visible
                  chatContext.setSelectedTabId(
                    chatContext.selectedTabId === 'history' ? 'chat' : 'history'
                  );
                }}
                display={chatContext.selectedTabId === 'history' ? 'fill' : undefined}
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
      {isRenameModelOpen && (
        <EditConversationNameModal
          sessionId={chatContext.sessionId!}
          onClose={handleEditConversationClose}
          defaultTitle={chatContext.title!}
        />
      )}
    </>
  );
});
