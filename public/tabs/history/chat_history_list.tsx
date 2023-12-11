/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiLink,
  EuiPanel,
  EuiText,
} from '@elastic/eui';
import moment from 'moment';

interface ChatHistory {
  id: string;
  title: string;
  updatedTimeMs: number;
}

interface ChatHistoryListItemProps extends ChatHistory {
  hasBottomBorder?: boolean;
  onTitleClick?: (id: string, title: string) => void;
  onDeleteClick?: (conversation: { id: string }) => void;
  onEditClick?: (conversation: { id: string; title: string }) => void;
}

export const ChatHistoryListItem = ({
  id,
  title,
  updatedTimeMs,
  hasBottomBorder = true,
  onTitleClick,
  onDeleteClick,
  onEditClick,
}: ChatHistoryListItemProps) => {
  const handleTitleClick = useCallback(() => {
    onTitleClick?.(id, title);
  }, [onTitleClick, id, title]);

  const handleDeleteClick = useCallback(() => {
    onDeleteClick?.({ id });
  }, [onDeleteClick, id]);

  const handleEditClick = useCallback(() => {
    onEditClick?.({ id, title });
  }, [onEditClick, id, title]);

  return (
    <>
      <EuiFlexGroup gutterSize="xs" responsive={false}>
        <EuiFlexItem>
          <EuiLink onClick={handleTitleClick}>
            <EuiText size="s">
              <p
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {title}
              </p>
            </EuiText>
          </EuiLink>
          <EuiText size="s" color="subdued">
            {moment(updatedTimeMs).format('MMMM D, YYYY')} at{' '}
            {moment(updatedTimeMs).format('h:m A')}
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="s" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                onClick={handleEditClick}
                iconType="pencil"
                aria-label="Edit conversation name"
                color="text"
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                onClick={handleDeleteClick}
                iconType="trash"
                color="danger"
                aria-label="Delete conversation"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
      {hasBottomBorder && <EuiHorizontalRule aria-label="history horizontal rule" />}
    </>
  );
};

export interface ChatHistoryListProps {
  chatHistories: ChatHistory[];
  onChatHistoryTitleClick?: (id: string, title: string) => void;
  onChatHistoryDeleteClick?: (conversation: { id: string }) => void;
  onChatHistoryEditClick?: (conversation: { id: string; title: string }) => void;
}

export const ChatHistoryList = ({
  chatHistories,
  onChatHistoryTitleClick,
  onChatHistoryEditClick,
  onChatHistoryDeleteClick,
}: ChatHistoryListProps) => {
  return (
    <>
      <EuiPanel hasBorder hasShadow>
        {chatHistories.map((item, index) => (
          <ChatHistoryListItem
            key={item.id}
            id={item.id}
            title={item.title}
            updatedTimeMs={item.updatedTimeMs}
            hasBottomBorder={index + 1 < chatHistories.length}
            onTitleClick={onChatHistoryTitleClick}
            onEditClick={onChatHistoryEditClick}
            onDeleteClick={onChatHistoryDeleteClick}
          />
        ))}
      </EuiPanel>
    </>
  );
};
