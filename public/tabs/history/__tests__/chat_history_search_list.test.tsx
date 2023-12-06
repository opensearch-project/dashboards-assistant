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

import { ChatHistorySearchList } from '../chat_history_search_list';

const setup = () => {
  const useChatContextMock = {
    sessionId: '1',
    setTitle: jest.fn(),
  };
  const useCoreMock = {
    services: coreMock.createStart(),
  };
  useCoreMock.services.http.put.mockImplementation(() => Promise.resolve());
  jest.spyOn(coreContextExports, 'useCore').mockReturnValue(useCoreMock);
  jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue(useChatContextMock);

  const renderResult = render(
    <I18nProvider>
      <ChatHistorySearchList
        loading={false}
        histories={[{ id: '1', title: 'foo', updatedTimeMs: 0 }]}
        onSearchChange={jest.fn()}
        onLoadChat={jest.fn()}
        onRefresh={jest.fn()}
        onHistoryDeleted={jest.fn()}
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
});
