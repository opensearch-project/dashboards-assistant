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
import * as services from '../../../services';

import { ChatHistorySearchList, ChatHistorySearchListProps } from '../chat_history_search_list';
import { DataSourceServiceMock } from '../../../services/data_source_service.mock';

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
    conversationId: '1',
    setTitle: jest.fn(),
  };
  const dataSourceServiceMock = new DataSourceServiceMock();
  const useCoreMock = {
    services: { ...coreMock.createStart(), dataSource: dataSourceServiceMock },
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
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should set new window title after edit conversation name', async () => {
    jest.spyOn(services, 'getConfigSchema').mockReturnValue({
      enabled: true,
      chat: {
        enabled: true,
        allowRenameConversation: true,
        trace: true,
        feedback: true,
      },
      incontextInsight: { enabled: true },
      next: { enabled: false },
      text2viz: { enabled: false },
      alertInsight: { enabled: false },
      smartAnomalyDetector: { enabled: false },
      branding: { label: undefined, logo: undefined },
    });
    const { renderResult, useChatContextMock } = setup();

    fireEvent.click(renderResult.getByLabelText('Edit conversation name'));

    fireEvent.change(renderResult.getByLabelText('Conversation name input'), {
      target: { value: 'bar' },
    });

    expect(useChatContextMock.setTitle).not.toHaveBeenCalled();

    fireEvent.click(renderResult.getByTestId('confirmModalConfirmButton'));

    waitFor(() => {
      expect(useChatContextMock.setTitle).toHaveBeenLastCalledWith('bar');
    });
  });

  it('should call onRefresh and onHistoryDeleted after conversation deleted', async () => {
    jest.spyOn(services, 'getConfigSchema').mockReturnValue({
      enabled: true,
      chat: {
        enabled: true,
        allowRenameConversation: false,
        trace: true,
        feedback: true,
      },
      incontextInsight: { enabled: true },
      next: { enabled: false },
      text2viz: { enabled: false },
      alertInsight: { enabled: false },
      smartAnomalyDetector: { enabled: false },
      branding: { label: undefined, logo: undefined },
    });
    const onRefreshMock = jest.fn();
    const onHistoryDeletedMock = jest.fn();

    const { renderResult } = setup({
      onRefresh: onRefreshMock,
      onHistoryDeleted: onHistoryDeletedMock,
    });

    fireEvent.click(renderResult.getByLabelText('Delete conversation'));

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
    jest.spyOn(services, 'getConfigSchema').mockReturnValue({
      enabled: true,
      chat: {
        enabled: true,
        allowRenameConversation: false,
        trace: true,
        feedback: true,
      },
      incontextInsight: { enabled: true },
      next: { enabled: false },
      text2viz: { enabled: false },
      alertInsight: { enabled: false },
      smartAnomalyDetector: { enabled: false },
      branding: { label: undefined, logo: undefined },
    });
    const { renderResult } = setup({
      histories: [],
    });

    expect(renderResult.getByText('There were no results found.')).toBeInTheDocument();
  });
});
