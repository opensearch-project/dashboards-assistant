/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonEmpty,
  EuiFlyoutBody,
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { useDebounce, useObservable } from 'react-use';
import cs from 'classnames';
import { useChatActions, useChatState } from '../../hooks';
import { useChatContext, useCore } from '../../contexts';
import { TAB_ID } from '../../utils/constants';
import { ChatHistorySearchList } from './chat_history_search_list';

interface ChatHistoryPageProps {
  shouldRefresh: boolean;
  className?: string;
}

export const ChatHistoryPage: React.FC<ChatHistoryPageProps> = React.memo((props) => {
  const { services } = useCore();
  const { loadChat } = useChatActions();
  const { chatStateDispatch } = useChatState();
  const {
    setSelectedTabId,
    flyoutFullScreen,
    sessionId,
    setSessionId,
    setTitle,
  } = useChatContext();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchName, setSearchName] = useState<string>();
  const [debouncedSearchName, setDebouncedSearchName] = useState<string>();
  const bulkGetOptions = useMemo(
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
  const sessions = useObservable(services.sessions.sessions$);
  const loading = useObservable(services.sessions.status$) === 'loading';
  const chatHistories = useMemo(() => sessions?.objects || [], [sessions]);
  const hasNoConversations = !debouncedSearchName && !!sessions && sessions.total === 0 && !loading;

  const handleSearchChange = useCallback((e) => {
    setSearchName(e.target.value);
  }, []);

  const handleItemsPerPageChange = useCallback((itemsPerPage: number) => {
    setPageIndex(0);
    setPageSize(itemsPerPage);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedTabId(TAB_ID.CHAT);
  }, [setSelectedTabId]);

  const handleHistoryDeleted = useCallback(
    (id: string) => {
      if (sessionId === id) {
        // Clear old session chat states
        setTitle(undefined);
        setSessionId(undefined);
        chatStateDispatch({ type: 'reset' });
      }
    },
    [sessionId, setSessionId, setTitle, chatStateDispatch]
  );

  useDebounce(
    () => {
      setPageIndex(0);
      setDebouncedSearchName(searchName);
    },
    150,
    [searchName]
  );

  useEffect(() => {
    if (props.shouldRefresh) services.sessions.reload();
  }, [props.shouldRefresh, services.sessions]);

  useEffect(() => {
    services.sessions.load(bulkGetOptions);
    return () => {
      services.sessions.abortController?.abort();
    };
  }, [services.sessions, bulkGetOptions]);

  return (
    <EuiFlyoutBody className={cs(props.className, 'llm-chat-flyout-body')}>
      <EuiPage>
        <EuiPageBody component="div">
          <EuiPageHeader responsive={false}>
            {flyoutFullScreen ? (
              <EuiFlexGroup gutterSize="none" justifyContent="flexEnd">
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon
                    aria-label="full screen back"
                    iconType="cross"
                    onClick={handleBack}
                  />
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
            <ChatHistorySearchList
              search={searchName}
              loading={loading}
              onSearchChange={handleSearchChange}
              onLoadChat={loadChat}
              onRefresh={services.sessions.reload}
              histories={chatHistories}
              activePage={pageIndex}
              itemsPerPage={pageSize}
              onChangeItemsPerPage={handleItemsPerPageChange}
              onChangePage={setPageIndex}
              {...(sessions ? { pageCount: Math.ceil(sessions.total / pageSize) } : {})}
              onHistoryDeleted={handleHistoryDeleted}
            />
          )}
        </EuiPageBody>
      </EuiPage>
    </EuiFlyoutBody>
  );
});
