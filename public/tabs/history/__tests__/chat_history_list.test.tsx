/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { ChatHistoryList } from '../chat_history_list';

describe('<ChatHistoryList />', () => {
  it('should render two history titles, update times and one horizontal rule', async () => {
    const { getByText, getAllByLabelText } = render(
      <ChatHistoryList
        chatHistories={[
          { id: '1', title: 'foo', updatedTimeMs: 0 },
          { id: '2', title: 'bar', updatedTimeMs: 360000 },
        ]}
      />
    );

    expect(getByText('foo')).toBeInTheDocument();
    expect(getByText('bar')).toBeInTheDocument();
    expect(getByText('January 1, 1970 at 12:0 AM')).toBeInTheDocument();
    expect(getByText('January 1, 1970 at 12:6 AM')).toBeInTheDocument();
    expect(getAllByLabelText('history horizontal rule')).toHaveLength(1);
  });

  it('should call onChatHistoryTitleClick  with id and title', () => {
    const onChatHistoryTitleClickMock = jest.fn();
    const { getByText } = render(
      <ChatHistoryList
        chatHistories={[{ id: '1', title: 'foo', updatedTimeMs: 0 }]}
        onChatHistoryTitleClick={onChatHistoryTitleClickMock}
      />
    );

    expect(onChatHistoryTitleClickMock).not.toHaveBeenCalled();
    fireEvent.click(getByText('foo'));
    expect(onChatHistoryTitleClickMock).toHaveBeenCalledWith('1', 'foo');
  });

  it('should call onChatHistoryEditClick with id and title', () => {
    const onChatHistoryEditClickMock = jest.fn();
    const { getByLabelText } = render(
      <ChatHistoryList
        chatHistories={[{ id: '1', title: 'foo', updatedTimeMs: 0 }]}
        onChatHistoryEditClick={onChatHistoryEditClickMock}
      />
    );

    expect(onChatHistoryEditClickMock).not.toHaveBeenCalled();
    fireEvent.click(getByLabelText('Edit conversation name'));
    expect(onChatHistoryEditClickMock).toHaveBeenCalledWith({ id: '1', title: 'foo' });
  });

  it('should call onChatHistoryDeleteClick with id and title', () => {
    const onChatHistoryDeleteClickMock = jest.fn();
    const { getByLabelText } = render(
      <ChatHistoryList
        chatHistories={[{ id: '1', title: 'foo', updatedTimeMs: 0 }]}
        onChatHistoryDeleteClick={onChatHistoryDeleteClickMock}
      />
    );

    expect(onChatHistoryDeleteClickMock).not.toHaveBeenCalled();
    fireEvent.click(getByLabelText('Delete conversation'));
    expect(onChatHistoryDeleteClickMock).toHaveBeenCalledWith({ id: '1' });
  });
});
