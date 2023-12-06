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
import { useChatContext } from '../contexts';
import { useChatActions, useChatState, useSaveChat } from '../hooks';
import { NotebookNameModal } from './notebook/notebook_name_modal';
import { ChatExperimentalBadge } from './chat_experimental_badge';
import { useCore } from '../contexts/core_context';
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
        const sessions = core.services.sessions.sessions$.getValue();
        if (sessions?.objects.find((session) => session.id === chatContext.sessionId)) {
          core.services.sessions.reload();
        }
      }
      setRenameModalOpen(false);
    },
    [chatContext, core.services.sessions]
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
