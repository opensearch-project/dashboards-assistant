/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { I18nProvider } from '@osd/i18n/react';

import * as useChatStateExports from '../../../hooks';
import * as contextsExports from '../../../contexts';

import { ChatHistoryPage } from '../chat_history_page';

const setup = () => {
  const useCoreMock = {
    services: {
      conversations: {
        conversations$: new BehaviorSubject({
          objects: [
            {
              id: '1',
              title: 'foo',
            },
          ],
          total: 1,
        }),
        status$: new BehaviorSubject('idle'),
        load: jest.fn(),
      },
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
  };
  jest.spyOn(contextsExports, 'useCore').mockReturnValue(useCoreMock);
  jest.spyOn(useChatStateExports, 'useChatState').mockReturnValue(useChatStateMock);
  jest.spyOn(contextsExports, 'useChatContext').mockReturnValue(useChatContextMock);

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
    const { renderResult, useChatStateMock, useChatContextMock } = setup();

    act(() => {
      fireEvent.click(renderResult.getByLabelText('Delete conversation'));
    });

    expect(useChatContextMock.setConversationId).not.toHaveBeenCalled();
    expect(useChatContextMock.setTitle).not.toHaveBeenCalled();
    expect(useChatStateMock.chatStateDispatch).not.toHaveBeenCalled();

    act(() => {
      fireEvent.click(renderResult.getByTestId('confirmModalConfirmButton'));
    });

    expect(useChatContextMock.setConversationId).toHaveBeenLastCalledWith(undefined);
    expect(useChatContextMock.setTitle).toHaveBeenLastCalledWith(undefined);
    expect(useChatStateMock.chatStateDispatch).toHaveBeenLastCalledWith({ type: 'reset' });
  });
});
