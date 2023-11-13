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
      // There is only one message in initial discussion, which will not be stored.
      disabled={chatState.messages.length <= 1}
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
                  chatContext.setSelectedTabId('history');
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
