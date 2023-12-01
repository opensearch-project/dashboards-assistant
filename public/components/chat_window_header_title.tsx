/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiButtonIcon,
} from '@elastic/eui';
import React, { useCallback, useState } from 'react';
import { useChatContext } from '../contexts/chat_context';
import { useChatActions } from '../hooks/use_chat_actions';
import { NotebookNameModal } from './notebook/notebook_name_modal';
import { ChatExperimentalBadge } from './chat_experimental_badge';
import { useCore } from '../contexts/core_context';
import { useChatState } from '../hooks/use_chat_state';
import { useSaveChat } from '../hooks/use_save_chat';
import { EditConversationNameModal } from './edit_conversation_name_modal';

export const ChatWindowHeaderTitle = React.memo(() => {
  const chatContext = useChatContext();
  const { loadChat } = useChatActions();
  const core = useCore();
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const [isRenameModalOpen, setRenameModalOpen] = useState(false);
  const { chatState } = useChatState();
  const { saveChat } = useSaveChat();

  const onButtonClick = useCallback(() => {
    setPopoverOpen((flag) => !flag);
  }, []);

  const closePopover = useCallback(() => {
    setPopoverOpen(false);
  }, []);

  const handleEditConversationClose = useCallback(
    (status: 'updated' | string, newTitle?: string) => {
      if (status === 'updated') {
        chatContext.setTitle(newTitle);
      }
      setRenameModalOpen(false);
    },
    [chatContext]
  );

  const button = (
    <EuiFlexGroup
      style={{ maxWidth: '300px', padding: '0 8px' }}
      gutterSize="xs"
      alignItems="center"
      responsive={false}
    >
      <EuiFlexItem onClick={onButtonClick} style={{ overflow: 'hidden' }}>
        <h3 className="eui-textTruncate">
          {chatContext.sessionId ? chatContext.title : 'OpenSearch Assistant'}
        </h3>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <ChatExperimentalBadge onClick={closePopover} />
      </EuiFlexItem>
      <EuiFlexItem onClick={onButtonClick} grow={false}>
        <EuiButtonIcon color="text" iconType="arrowDown" />
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  const items = [
    <EuiContextMenuItem
      disabled={!chatContext.sessionId}
      key="rename-conversation"
      onClick={() => {
        closePopover();
        setRenameModalOpen(true);
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
      disabled={chatState.messages.every((item) => item.type !== 'input')}
    >
      Save to notebook
    </EuiContextMenuItem>,
  ];

  return (
    <>
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
      {isRenameModalOpen && (
        <EditConversationNameModal
          sessionId={chatContext.sessionId!}
          onClose={handleEditConversationClose}
          defaultTitle={chatContext.title!}
        />
      )}
    </>
  );
});
