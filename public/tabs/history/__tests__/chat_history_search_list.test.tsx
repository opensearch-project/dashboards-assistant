/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';

import { coreMock } from '../../../../../../src/core/public/mocks';
import * as chatContextExports from '../../../contexts/chat_context';
import * as coreContextExports from '../../../contexts/core_context';

import { ChatHistorySearchList, ChatHistorySearchListProps } from '../chat_history_search_list';

const setup = ({
  loading = false,
  histories = [{ id: '1', title: 'foo', updatedTimeMs: 0 }],
  onSearchChange = jest.fn(),
  onLoadChat = jest.fn(),
  onRefresh = jest.fn(),
  onHistoryDeleted = jest.fn(),
  ...restProps
}: Partial<ChatHistorySearchListProps> = {}) => {
  const useChatContextMock = {
    sessionId: '1',
    setTitle: jest.fn(),
  };
  const useCoreMock = {
    services: coreMock.createStart(),
  };
  useCoreMock.services.http.put.mockImplementation(() => Promise.resolve());
  useCoreMock.services.http.delete.mockImplementation(() => Promise.resolve());
  jest.spyOn(coreContextExports, 'useCore').mockReturnValue(useCoreMock);
  jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue(useChatContextMock);

  const renderResult = render(
    <I18nProvider>
      <ChatHistorySearchList
        loading={loading}
        histories={histories}
        onSearchChange={onSearchChange}
        onLoadChat={onLoadChat}
        onRefresh={onRefresh}
        onHistoryDeleted={onHistoryDeleted}
        {...restProps}
      />
    </I18nProvider>
  );

  return {
    useChatContextMock,
    renderResult,
  };
};

describe('<ChatHistorySearchList />', () => {
  it('should set new window title after edit conversation name', async () => {
    const { renderResult, useChatContextMock } = setup();

    act(() => {
      fireEvent.click(renderResult.getByLabelText('Edit conversation name'));
    });

    act(() => {
      fireEvent.change(renderResult.getByLabelText('Conversation name input'), {
        target: { value: 'bar' },
      });
    });

    expect(useChatContextMock.setTitle).not.toHaveBeenCalled();

    act(() => {
      fireEvent.click(renderResult.getByTestId('confirmModalConfirmButton'));
    });

    waitFor(() => {
      expect(useChatContextMock.setTitle).toHaveBeenLastCalledWith('bar');
    });
  });

  it('should call onRefresh and onHistoryDeleted after conversation deleted', async () => {
    const onRefreshMock = jest.fn();
    const onHistoryDeletedMock = jest.fn();

    const { renderResult } = setup({
      onRefresh: onRefreshMock,
      onHistoryDeleted: onHistoryDeletedMock,
    });

    act(() => {
      fireEvent.click(renderResult.getByLabelText('Delete conversation'));
    });

    expect(onRefreshMock).not.toHaveBeenCalled();
    expect(onHistoryDeletedMock).not.toHaveBeenCalled();

    await waitFor(async () => {
      fireEvent.click(renderResult.getByTestId('confirmModalConfirmButton'));
    });

    await waitFor(async () => {
      expect(onRefreshMock).toHaveBeenCalled();
      expect(onHistoryDeletedMock).toHaveBeenCalledWith('1');
    });
  });

  it('should display empty panel', () => {
    const { renderResult } = setup({
      histories: [],
    });

    expect(renderResult.getByText('There were no results found.')).toBeInTheDocument();
  });
});
