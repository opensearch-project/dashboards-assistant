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
import { useDebounce, useObservable, useUpdateEffect } from 'react-use';
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
    conversationId,
    setConversationId,
    setTitle,
  } = useChatContext();
  const [searchName, setSearchName] = useState<string>('');
  const [bulkGetOptions, setBulkGetOptions] = useState<{
    page: number;
    perPage: number;
    fields: string[];
    sortField: string;
    sortOrder: string;
    searchFields: string[];
    search?: string;
  }>({
    page: 1,
    perPage: 10,
    fields: ['createdTimeMs', 'updatedTimeMs', 'title'],
    sortField: 'updatedTimeMs',
    sortOrder: 'DESC',
    searchFields: ['title'],
  });
  const conversations = useObservable(services.conversations.conversations$);
  const loading = useObservable(services.conversations.status$) === 'loading';
  const chatHistories = useMemo(() => conversations?.objects || [], [conversations]);
  const hasNoConversations =
    !bulkGetOptions.search && !!conversations && conversations.total === 0 && !loading;
  const dataSourceUpdate = useObservable(services.dataSource.dataSourceIdUpdates$);

  const handleSearchChange = useCallback((e) => {
    setSearchName(e.target.value);
  }, []);

  const handleItemsPerPageChange = useCallback((itemsPerPage: number) => {
    setBulkGetOptions((prevOptions) => ({ ...prevOptions, page: 1, perPage: itemsPerPage }));
  }, []);

  const handleBack = useCallback(() => {
    setSelectedTabId(TAB_ID.CHAT);
  }, [setSelectedTabId]);

  const handleHistoryDeleted = useCallback(
    (id: string) => {
      if (conversationId === id) {
        // Clear old conversation chat states
        setTitle(undefined);
        setConversationId(undefined);
        chatStateDispatch({ type: 'reset' });
      }
    },
    [conversationId, setConversationId, setTitle, chatStateDispatch]
  );

  const handlePageChange = useCallback((newPage) => {
    setBulkGetOptions((prevOptions) => ({
      ...prevOptions,
      page: newPage + 1,
    }));
  }, []);

  useDebounce(
    () => {
      setBulkGetOptions((prevOptions) => {
        if (prevOptions.search === searchName || (!prevOptions.search && searchName === '')) {
          return prevOptions;
        }
        const { search, ...rest } = prevOptions;
        return {
          ...rest,
          page: 1,
          ...(searchName ? { search: searchName } : {}),
        };
      });
    },
    150,
    [searchName]
  );

  useUpdateEffect(() => {
    if (!props.shouldRefresh) {
      return;
    }
    services.conversations.reload();
    return () => {
      services.conversations.abortController?.abort();
    };
  }, [props.shouldRefresh, services.conversations]);

  useUpdateEffect(() => {
    setSearchName('');
    setBulkGetOptions(({ search, page, ...rest }) => ({
      ...rest,
      page: 1,
    }));
  }, [dataSourceUpdate]);

  useEffect(() => {
    services.conversations.load(bulkGetOptions);
    return () => {
      services.conversations.abortController?.abort();
    };
  }, [services.conversations, bulkGetOptions]);

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
              onRefresh={services.conversations.reload}
              histories={chatHistories}
              activePage={bulkGetOptions.page - 1}
              itemsPerPage={bulkGetOptions.perPage}
              onChangeItemsPerPage={handleItemsPerPageChange}
              onChangePage={handlePageChange}
              {...(conversations
                ? { pageCount: Math.ceil(conversations.total / bulkGetOptions.perPage) }
                : {})}
              onHistoryDeleted={handleHistoryDeleted}
            />
          )}
        </EuiPageBody>
      </EuiPage>
    </EuiFlyoutBody>
  );
});
