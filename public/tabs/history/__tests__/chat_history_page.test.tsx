/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { I18nProvider } from '@osd/i18n/react';

import * as useChatStateExports from '../../../hooks/use_chat_state';
import * as chatContextExports from '../../../contexts/chat_context';
import * as coreContextExports from '../../../contexts/core_context';

import { ChatHistoryPage } from '../chat_history_page';

const setup = () => {
  const useCoreMock = {
    services: {
      sessions: {
        sessions$: new BehaviorSubject({
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
      sessionLoad: {},
    },
  };
  const useChatStateMock = {
    chatStateDispatch: jest.fn(),
  };
  const useChatContextMock = {
    sessionId: '1',
    setSessionId: jest.fn(),
    setTitle: jest.fn(),
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
  it('should clear old session data after current session deleted', async () => {
    const { renderResult, useChatStateMock, useChatContextMock } = setup();

    act(() => {
      fireEvent.click(renderResult.getByLabelText('Delete conversation'));
    });

    expect(useChatContextMock.setSessionId).not.toHaveBeenCalled();
    expect(useChatContextMock.setTitle).not.toHaveBeenCalled();
    expect(useChatStateMock.chatStateDispatch).not.toHaveBeenCalled();

    act(() => {
      fireEvent.click(renderResult.getByTestId('confirmModalConfirmButton'));
    });

    expect(useChatContextMock.setSessionId).toHaveBeenLastCalledWith(undefined);
    expect(useChatContextMock.setTitle).toHaveBeenLastCalledWith(undefined);
    expect(useChatStateMock.chatStateDispatch).toHaveBeenLastCalledWith({ type: 'reset' });
  });
});
