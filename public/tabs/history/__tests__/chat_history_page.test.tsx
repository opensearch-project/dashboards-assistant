/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';

import { coreMock } from '../../../../../../src/core/public/mocks';
import { HttpStart } from '../../../../../../src/core/public';

import * as useChatStateExports from '../../../hooks/use_chat_state';
import * as chatContextExports from '../../../contexts/chat_context';
import * as coreContextExports from '../../../contexts/core_context';
import { ConversationsService } from '../../../services/conversations_service';
import { DataSourceServiceMock } from '../../../services/data_source_service.mock';

import { ChatHistoryPage } from '../chat_history_page';

const mockGetConversationsHttp = () => {
  const http = coreMock.createStart().http;
  http.get.mockImplementation(async () => ({
    objects: [
      {
        id: '1',
        title: 'foo',
      },
    ],
    total: 1,
  }));
  return http;
};

const setup = ({
  http = mockGetConversationsHttp(),
  chatContext = {},
}: {
  http?: HttpStart;
  chatContext?: { flyoutFullScreen?: boolean };
} = {}) => {
  const useCoreMock = {
    services: {
      ...coreMock.createStart(),
      http,
      conversations: new ConversationsService(http, new DataSourceServiceMock()),
      conversationLoad: {},
    },
  };
  const useChatStateMock = {
    chatStateDispatch: jest.fn(),
  };
  const useChatContextMock = {
    conversationId: '1',
    setConversationId: jest.fn(),
    setTitle: jest.fn(),
    setSelectedTabId: jest.fn(),
    ...chatContext,
  };
  jest.spyOn(coreContextExports, 'useCore').mockReturnValue(useCoreMock);
  jest.spyOn(useChatStateExports, 'useChatState').mockReturnValue(useChatStateMock);
  jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue(useChatContextMock);

  const renderResult = render(
    <I18nProvider>
      <ChatHistoryPage shouldRefresh={false} />
    </I18nProvider>
  );

  return {
    useCoreMock,
    useChatStateMock,
    useChatContextMock,
    renderResult,
  };
};

describe('<ChatHistoryPage />', () => {
  it('should clear old conversation data after current conversation deleted', async () => {
    const { renderResult, useChatStateMock, useChatContextMock } = setup({
      http: mockGetConversationsHttp(),
    });

    await waitFor(() => {
      expect(renderResult.getByLabelText('Delete conversation')).toBeTruthy();
    });

    fireEvent.click(renderResult.getByLabelText('Delete conversation'));

    expect(useChatContextMock.setConversationId).not.toHaveBeenCalled();
    expect(useChatContextMock.setTitle).not.toHaveBeenCalled();
    expect(useChatStateMock.chatStateDispatch).not.toHaveBeenCalled();

    fireEvent.click(renderResult.getByTestId('confirmModalConfirmButton'));

    expect(useChatContextMock.setConversationId).toHaveBeenLastCalledWith(undefined);
    expect(useChatContextMock.setTitle).toHaveBeenLastCalledWith(undefined);
    expect(useChatStateMock.chatStateDispatch).toHaveBeenLastCalledWith({ type: 'reset' });
  });

  it('should render empty screen', async () => {
    const http = coreMock.createStart().http;
    http.get.mockImplementation(async () => {
      return {
        objects: [],
        total: 0,
      };
    });
    const { renderResult } = setup({
      http,
    });

    await waitFor(async () => {
      expect(
        renderResult.getByText(
          'No conversation has been recorded. Start a conversation in the assistant to have it saved.'
        )
      ).toBeTruthy();
    });
  });

  it('should render full screen back icon button instead of back', async () => {
    const { renderResult } = setup({
      chatContext: {
        flyoutFullScreen: true,
      },
    });
    await waitFor(async () => {
      expect(renderResult.getByLabelText('full screen back')).toBeTruthy();
      expect(renderResult.queryByRole('button', { name: 'Back' })).toBeFalsy();
    });
  });

  it('should render back button and history list', async () => {
    const { renderResult } = setup();
    await waitFor(async () => {
      expect(renderResult.getByRole('button', { name: 'Back' })).toBeTruthy();
      expect(renderResult.getByText('foo')).toBeTruthy();
    });
  });

  it('should call get conversations with search text', async () => {
    const { renderResult, useCoreMock } = setup();
    await waitFor(async () => {
      expect(renderResult.getByPlaceholderText('Search by conversation name')).toBeTruthy();
    });
    fireEvent.change(renderResult.getByPlaceholderText('Search by conversation name'), {
      target: {
        value: 'bar',
      },
    });
    await waitFor(() => {
      expect(useCoreMock.services.http.get).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          query: expect.objectContaining({
            search: 'bar',
            page: 1,
          }),
        })
      );
    });
  });

  it('should call get conversations with new page size', async () => {
    const { renderResult, useCoreMock } = setup();
    fireEvent.click(renderResult.getByTestId('tablePaginationPopoverButton'));
    fireEvent.click(renderResult.getByTestId('tablePagination-50-rows'));
    await waitFor(() => {
      expect(useCoreMock.services.http.get).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          query: expect.objectContaining({
            page: 1,
            perPage: 50,
          }),
        })
      );
    });
  });

  it('should call setSelectedTabId with "chat" after back button click', async () => {
    const { renderResult, useChatContextMock } = setup();

    expect(useChatContextMock.setSelectedTabId).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByRole('button', { name: 'Back' }));
    await waitFor(() => {
      expect(useChatContextMock.setSelectedTabId).toHaveBeenLastCalledWith('chat');
    });
  });

  it('should call setSelectedTabId with "chat" after full screen back button click', async () => {
    const { renderResult, useChatContextMock } = setup({
      chatContext: {
        flyoutFullScreen: true,
      },
    });

    expect(useChatContextMock.setSelectedTabId).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByLabelText('full screen back'));
    await waitFor(() => {
      expect(useChatContextMock.setSelectedTabId).toHaveBeenLastCalledWith('chat');
    });
  });

  it('should call conversations.reload after shouldRefresh change', async () => {
    const { renderResult, useCoreMock } = setup();

    jest.spyOn(useCoreMock.services.conversations, 'reload');

    expect(useCoreMock.services.conversations.reload).not.toHaveBeenCalled();

    renderResult.rerender(
      <I18nProvider>
        <ChatHistoryPage shouldRefresh={true} />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(useCoreMock.services.conversations.reload).toHaveBeenCalled();
    });
  });

  it('should call conversations.abortController.abort after unmount', async () => {
    const { renderResult, useCoreMock } = setup();

    await waitFor(() => {
      expect(useCoreMock.services.conversations.abortController).toBeTruthy();
    });
    const abortMock = jest.spyOn(useCoreMock.services.conversations.abortController!, 'abort');

    expect(abortMock).not.toHaveBeenCalled();

    renderResult.unmount();

    await waitFor(() => {
      expect(abortMock).toHaveBeenCalled();
    });
  });
});
