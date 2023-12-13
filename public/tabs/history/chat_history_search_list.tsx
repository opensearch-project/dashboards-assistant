/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiFieldSearch,
  EuiFieldSearchProps,
  EuiPanel,
  EuiSpacer,
  EuiTablePagination,
  EuiTablePaginationProps,
  EuiText,
} from '@elastic/eui';
import React, { useCallback, useState } from 'react';
import { ChatHistoryList, ChatHistoryListProps } from './chat_history_list';
import { EditConversationNameModal } from '../../components/edit_conversation_name_modal';
import { DeleteConversationConfirmModal } from './delete_conversation_confirm_modal';
import { useChatContext } from '../../contexts';

export interface ChatHistorySearchListProps
  extends Pick<
    EuiTablePaginationProps,
    'activePage' | 'itemsPerPage' | 'onChangeItemsPerPage' | 'onChangePage' | 'pageCount'
  > {
  search?: string;
  loading: boolean;
  histories: ChatHistoryListProps['chatHistories'];
  onSearchChange: EuiFieldSearchProps['onChange'];
  onLoadChat: (sessionId?: string | undefined, title?: string | undefined) => void;
  onRefresh: () => void;
  onHistoryDeleted: (id: string) => void;
}

export const ChatHistorySearchList = ({
  search,
  loading,
  histories,
  pageCount,
  activePage,
  itemsPerPage,
  onRefresh,
  onLoadChat,
  onChangePage,
  onSearchChange,
  onHistoryDeleted,
  onChangeItemsPerPage,
}: ChatHistorySearchListProps) => {
  const { sessionId, setTitle } = useChatContext();
  const [editingConversation, setEditingConversation] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deletingConversation, setDeletingConversation] = useState<{ id: string } | null>(null);

  const handleEditConversationModalClose = useCallback(
    (status: 'updated' | string, newTitle?: string) => {
      if (status === 'updated') {
        onRefresh();
        if (sessionId === editingConversation?.id) {
          setTitle(newTitle);
        }
      }
      setEditingConversation(null);
    },
    [setEditingConversation, onRefresh, editingConversation, sessionId, setTitle]
  );

  const handleDeleteConversationConfirmModalClose = useCallback(
    (status: 'deleted' | string) => {
      if (status === 'deleted') {
        onRefresh();
      }
      if (!deletingConversation) {
        return;
      }
      onHistoryDeleted(deletingConversation.id);
      setDeletingConversation(null);
    },
    [setDeletingConversation, onRefresh, deletingConversation, onHistoryDeleted]
  );
  return (
    <>
      <EuiFieldSearch
        placeholder="Search by conversation name"
        value={search}
        onChange={onSearchChange}
        fullWidth
      />
      <EuiSpacer size="s" />
      <EuiSpacer size="xs" />
      {!loading && histories.length === 0 ? (
        <EuiPanel hasBorder hasShadow paddingSize="s" borderRadius="m">
          <EuiText size="s">
            <p>There were no results found.</p>
          </EuiText>
          <EuiSpacer size="s" />
        </EuiPanel>
      ) : (
        <>
          <ChatHistoryList
            chatHistories={histories}
            onChatHistoryTitleClick={onLoadChat}
            onChatHistoryEditClick={setEditingConversation}
            onChatHistoryDeleteClick={setDeletingConversation}
          />
          <EuiTablePagination
            activePage={activePage}
            itemsPerPage={itemsPerPage}
            onChangeItemsPerPage={onChangeItemsPerPage}
            onChangePage={onChangePage}
            pageCount={pageCount}
          />
          {editingConversation && (
            <EditConversationNameModal
              onClose={handleEditConversationModalClose}
              sessionId={editingConversation.id}
              defaultTitle={editingConversation.title}
            />
          )}
          {deletingConversation && (
            <DeleteConversationConfirmModal
              sessionId={deletingConversation.id}
              onClose={handleDeleteConversationConfirmModalClose}
            />
          )}
        </>
      )}
    </>
  );
};
