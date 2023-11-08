/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiFieldSearch,
  EuiFlyoutBody,
  EuiPage,
  EuiPageBody,
  EuiSpacer,
  EuiTablePagination,
  EuiTitle,
} from '@elastic/eui';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { useDebounce } from 'react-use';
import cs from 'classnames';
import { SavedObjectsFindOptions } from '../../../../../src/core/public';
import { useChatActions } from '../../hooks/use_chat_actions';
import { useGetSessions } from '../../hooks/use_sessions';
import { ChatHistoryList } from './chat_history_list';
import { EditConversationNameModal } from '../../components/edit_conversation_name_modal';
import { DeleteConversationConfirmModal } from './delete_conversation_confirm_modal';

interface ChatHistoryPageProps {
  shouldRefresh: boolean;
  className?: string;
}

export const ChatHistoryPage: React.FC<ChatHistoryPageProps> = (props) => {
  const { loadChat } = useChatActions();
  const [editingConversation, setEditingConversation] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deletingConversation, setDeletingConversation] = useState<{ id: string } | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchName, setSearchName] = useState<string>();
  const [debouncedSearchName, setDebouncedSearchName] = useState<string>();
  const bulkGetOptions: Partial<SavedObjectsFindOptions> = useMemo(
    () => ({
      page: pageIndex + 1,
      perPage: pageSize,
      fields: ['createdTimeMs', 'updatedTimeMs', 'title'],
      sortField: 'updatedTimeMs',
      sortOrder: 'DESC',
      ...(debouncedSearchName ? { search: debouncedSearchName, searchFields: ['title'] } : {}),
    }),
    [pageIndex, pageSize, debouncedSearchName]
  );
  const { data: sessions, refresh } = useGetSessions(bulkGetOptions);

  const chatHistories = useMemo(() => sessions?.objects || [], [sessions]);

  const handleEditConversationCancel = useCallback(
    (status: 'updated' | string) => {
      if (status === 'updated') {
        refresh();
      }
      setEditingConversation(null);
    },
    [setEditingConversation]
  );

  const handleDeleteConversationCancel = useCallback(
    (status: 'deleted' | string) => {
      if (status === 'deleted') {
        refresh();
      }
      setDeletingConversation(null);
    },
    [setDeletingConversation, refresh]
  );

  const handleSearchChange = useCallback((e) => {
    setSearchName(e.target.value);
  }, []);

  useDebounce(
    () => {
      setPageIndex(0);
      setDebouncedSearchName(searchName);
    },
    150,
    [searchName]
  );

  useEffect(() => {
    if (props.shouldRefresh) refresh();
  }, [props.shouldRefresh]);

  return (
    <EuiFlyoutBody className={cs(props.className, 'llm-chat-flyout-body')}>
      <EuiPage>
        <EuiPageBody component="div">
          <EuiTitle size="s">
            <h3>
              <FormattedMessage id="assistant.olly.history.title" defaultMessage="Conversations" />
            </h3>
          </EuiTitle>
          <EuiSpacer size="s" />
          <EuiSpacer size="xs" />
          <EuiFieldSearch
            placeholder="Search by conversation or date"
            value={searchName}
            onChange={handleSearchChange}
            fullWidth
          />
          <EuiSpacer size="s" />
          <EuiSpacer size="xs" />
          <ChatHistoryList
            chatHistories={chatHistories}
            onChatHistoryTitleClick={loadChat}
            onChatHistoryEditClick={setEditingConversation}
            onChatHistoryDeleteClick={setDeletingConversation}
          />
          <EuiTablePagination
            activePage={pageIndex}
            itemsPerPage={pageSize}
            onChangeItemsPerPage={setPageSize}
            onChangePage={setPageIndex}
            {...(sessions ? { pageCount: Math.ceil(sessions.total / pageSize) } : {})}
          />
          {editingConversation && (
            <EditConversationNameModal
              onClose={handleEditConversationCancel}
              sessionId={editingConversation.id}
              defaultTitle={editingConversation.title}
            />
          )}
          {deletingConversation && (
            <DeleteConversationConfirmModal
              sessionId={deletingConversation.id}
              onClose={handleDeleteConversationCancel}
            />
          )}
        </EuiPageBody>
      </EuiPage>
    </EuiFlyoutBody>
  );
};
