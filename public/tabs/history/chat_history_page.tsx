/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonEmpty,
  EuiFieldSearch,
  EuiFieldSearchProps,
  EuiFlyoutBody,
  EuiPage,
  EuiPageBody,
  EuiPanel,
  EuiPageHeader,
  EuiSpacer,
  EuiTablePagination,
  EuiTablePaginationProps,
  EuiText,
  EuiTitle,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { useDebounce } from 'react-use';
import cs from 'classnames';
import { SavedObjectsFindOptions } from '../../../../../src/core/public';
import { useChatActions } from '../../hooks/use_chat_actions';
import { useGetSessions } from '../../hooks/use_sessions';
import { useChatContext } from '../../contexts/chat_context';
import { ChatHistoryList, ChatHistoryListProps } from './chat_history_list';
import { EditConversationNameModal } from '../../components/edit_conversation_name_modal';
import { DeleteConversationConfirmModal } from './delete_conversation_confirm_modal';

interface HistorySearchListProps
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
}

const HistorySearchList = ({
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
  onChangeItemsPerPage,
}: HistorySearchListProps) => {
  const [editingConversation, setEditingConversation] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deletingConversation, setDeletingConversation] = useState<{ id: string } | null>(null);

  const handleEditConversationCancel = useCallback(
    (status: 'updated' | string) => {
      if (status === 'updated') {
        onRefresh();
      }
      setEditingConversation(null);
    },
    [setEditingConversation, onRefresh]
  );

  const handleDeleteConversationCancel = useCallback(
    (status: 'deleted' | string) => {
      if (status === 'deleted') {
        onRefresh();
      }
      setDeletingConversation(null);
    },
    [setDeletingConversation, onRefresh]
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
        </>
      )}
    </>
  );
};

interface ChatHistoryPageProps {
  shouldRefresh: boolean;
  className?: string;
}

export const ChatHistoryPage: React.FC<ChatHistoryPageProps> = React.memo((props) => {
  const { loadChat } = useChatActions();
  const { setSelectedTabId, flyoutFullScreen } = useChatContext();
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
  const { refresh, loading, ...rest } = useGetSessions(bulkGetOptions);
  const { data: sessions } = rest;
  const chatHistories = useMemo(() => sessions?.objects || [], [sessions]);
  const hasNoConversations =
    !debouncedSearchName && 'data' in rest && rest.data?.total === 0 && !loading;

  const handleSearchChange = useCallback((e) => {
    setSearchName(e.target.value);
  }, []);

  const handleItemsPerPageChange = useCallback((itemsPerPage: number) => {
    setPageIndex(0);
    setPageSize(itemsPerPage);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedTabId('chat');
  }, [setSelectedTabId]);

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
          <EuiPageHeader>
            {flyoutFullScreen ? (
              <EuiFlexGroup gutterSize="none" justifyContent="flexEnd">
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon iconType="cross" onClick={handleBack} />
                </EuiFlexItem>
              </EuiFlexGroup>
            ) : (
              <EuiButtonEmpty flush="left" size="xs" onClick={handleBack} iconType="arrowLeft">
                Back
              </EuiButtonEmpty>
            )}
          </EuiPageHeader>
          <EuiTitle size="s">
            <h3>
              <FormattedMessage id="assistant.olly.history.title" defaultMessage="Conversations" />
            </h3>
          </EuiTitle>
          <EuiSpacer size="s" />
          <EuiSpacer size="xs" />
          {hasNoConversations ? (
            <EuiText>
              <p>
                No conversation has been recorded. Start a conversation in the assistant to have it
                saved.
              </p>
            </EuiText>
          ) : (
            <HistorySearchList
              search={searchName}
              loading={loading}
              onSearchChange={handleSearchChange}
              onLoadChat={loadChat}
              onRefresh={refresh}
              histories={chatHistories}
              activePage={pageIndex}
              itemsPerPage={pageSize}
              onChangeItemsPerPage={handleItemsPerPageChange}
              onChangePage={setPageIndex}
              {...(sessions ? { pageCount: Math.ceil(sessions.total / pageSize) } : {})}
            />
          )}
        </EuiPageBody>
      </EuiPage>
    </EuiFlyoutBody>
  );
});
