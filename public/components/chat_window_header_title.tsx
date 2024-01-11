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
  const [isSaveNotebookModalOpen, setSaveNotebookModalOpen] = useState(false);
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
        const conversations = core.services.conversations.conversations$.getValue();
        if (
          conversations?.objects.find(
            (conversation) => conversation.id === chatContext.conversationId
          )
        ) {
          core.services.conversations.reload();
        }
      }
      setRenameModalOpen(false);
    },
    [chatContext, core.services.conversations]
  );

  const handleSaveNotebookModalClose = () => {
    setSaveNotebookModalOpen(false);
  };

  const button = (
    <EuiFlexGroup
      style={{ maxWidth: '300px', padding: '0 8px' }}
      gutterSize="xs"
      alignItems="center"
      responsive={false}
    >
      <EuiFlexItem onClick={onButtonClick} style={{ overflow: 'hidden' }}>
        <h3 className="eui-textTruncate">
          {chatContext.conversationId ? chatContext.title : 'OpenSearch Assistant'}
        </h3>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <ChatExperimentalBadge onClick={closePopover} />
      </EuiFlexItem>
      <EuiFlexItem onClick={onButtonClick} grow={false}>
        <EuiButtonIcon aria-label="toggle chat context menu" color="text" iconType="arrowDown" />
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  const items = [
    <EuiContextMenuItem
      disabled={!chatContext.conversationId}
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
        // Only show toast when previous conversation saved
        if (!!chatContext.conversationId) {
          core.services.notifications.toasts.addSuccess(
            'A new conversation is started and the previous one is saved.'
          );
        }
      }}
    >
      New conversation
    </EuiContextMenuItem>,
    <EuiContextMenuItem
      key="save-as-notebook"
      onClick={() => {
        closePopover();
        setSaveNotebookModalOpen(true);
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
          conversationId={chatContext.conversationId!}
          onClose={handleEditConversationClose}
          defaultTitle={chatContext.title!}
        />
      )}
      {isSaveNotebookModalOpen && (
        <NotebookNameModal onClose={handleSaveNotebookModalClose} saveChat={saveChat} />
      )}
    </>
  );
});
