/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CriteriaWithPagination,
  Direction,
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiFlyoutBody,
  EuiLink,
  EuiPage,
  EuiPageBody,
  EuiText,
} from '@elastic/eui';
import React, { useEffect, useMemo, useState } from 'react';
import { SavedObjectsFindOptions } from '../../../../../src/core/public';
import { ISessionFindResponse } from '../../../common/types/chat_saved_object_attributes';
import { useChatActions } from '../../hooks/use_chat_actions';
import { useGetSessions } from '../../hooks/use_sessions';

interface ChatHistoryPageProps {
  shouldRefresh: boolean;
  className?: string;
}

type ItemType = ISessionFindResponse['objects'][number];

export const ChatHistoryPage: React.FC<ChatHistoryPageProps> = (props) => {
  const { loadChat } = useChatActions();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [sortOrder, setSortOrder] = useState<Direction>('desc');
  const [sortField, setSortField] = useState<keyof ItemType>('updatedTimeMs');
  const bulkGetOptions: Partial<SavedObjectsFindOptions> = useMemo(
    () => ({
      page: pageIndex + 1,
      perPage: pageSize,
      sortOrder,
      sortField,
      fields: ['createdTimeMs', 'updatedTimeMs', 'title'],
    }),
    [pageIndex, pageSize, sortOrder, sortField]
  );
  const { data: sessions, loading, error, refresh } = useGetSessions(bulkGetOptions);

  useEffect(() => {
    if (props.shouldRefresh) refresh();
  }, [props.shouldRefresh]);

  const onTableChange = (criteria: CriteriaWithPagination<ItemType>) => {
    const { index, size } = criteria.page;
    setPageIndex(index);
    setPageSize(size);
    if (criteria.sort) {
      const { field, direction } = criteria.sort;
      setSortField(field);
      setSortOrder(direction);
    }
  };

  const columns: Array<EuiBasicTableColumn<ItemType>> = [
    {
      field: 'id',
      name: 'Chat',
      render: (id: string, item) => <EuiLink onClick={() => loadChat(id)}>{item.title}</EuiLink>,
    },
    {
      field: 'updatedTimeMs',
      name: 'Updated Time',
      sortable: true,
      render: (updatedTimeMs: number) => (
        <EuiText size="s">{new Date(updatedTimeMs).toLocaleString()}</EuiText>
      ),
    },
  ];

  return (
    <EuiFlyoutBody className={props.className}>
      <EuiPage>
        <EuiPageBody component="div">
          <EuiBasicTable
            items={sessions?.objects || []}
            rowHeader="id"
            loading={loading}
            error={error?.message}
            columns={columns}
            pagination={{
              pageIndex,
              pageSize,
              pageSizeOptions: [10, 20, 50],
              totalItemCount: sessions?.total || 0,
            }}
            onChange={onTableChange}
            sorting={{ sort: { field: sortField, direction: sortOrder } }}
          />
        </EuiPageBody>
      </EuiPage>
    </EuiFlyoutBody>
  );
};
