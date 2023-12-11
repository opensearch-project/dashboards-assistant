/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { I18nProvider } from '@osd/i18n/react';

import { coreMock } from '../../../../../src/core/public/mocks';
import * as useChatStateExports from '../../hooks/use_chat_state';
import * as useChatActionsExports from '../../hooks/use_chat_actions';
import * as useSaveChatExports from '../../hooks/use_save_chat';
import * as chatContextExports from '../../contexts/chat_context';
import * as coreContextExports from '../../contexts/core_context';

import { ChatWindowHeaderTitle } from '../chat_window_header_title';

const setup = () => {
  const useCoreMock = {
    services: {
      ...coreMock.createStart(),
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
        reload: jest.fn(),
      },
    },
  };
  useCoreMock.services.http.put.mockImplementation(() => Promise.resolve());

  const useChatStateMock = {
    chatState: { messages: [] },
  };
  const useChatContextMock = {
    sessionId: '1',
    title: 'foo',
    setSessionId: jest.fn(),
    setTitle: jest.fn(),
  };
  const useChatActionsMock = {
    loadChat: jest.fn(),
  };
  const useSaveChatMock = {
    saveChat: jest.fn(),
  };
  jest.spyOn(coreContextExports, 'useCore').mockReturnValue(useCoreMock);
  jest.spyOn(useChatStateExports, 'useChatState').mockReturnValue(useChatStateMock);
  jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue(useChatContextMock);
  jest.spyOn(useChatActionsExports, 'useChatActions').mockReturnValue(useChatActionsMock);
  jest.spyOn(useSaveChatExports, 'useSaveChat').mockReturnValue(useSaveChatMock);

  const renderResult = render(
    <I18nProvider>
      <ChatWindowHeaderTitle />
    </I18nProvider>
  );

  return {
    useCoreMock,
    useChatStateMock,
    useChatContextMock,
    renderResult,
  };
};

describe('<ChatWindowHeaderTitle />', () => {
  it('should reload history list after edit conversation name', async () => {
    const { renderResult, useCoreMock } = setup();

    act(() => {
      fireEvent.click(renderResult.getByText('foo'));
    });

    act(() => {
      fireEvent.click(renderResult.getByText('Rename conversation'));
    });

    act(() => {
      fireEvent.change(renderResult.getByLabelText('Conversation name input'), {
        target: { value: 'bar' },
      });
    });

    expect(useCoreMock.services.sessions.reload).not.toHaveBeenCalled();

    act(() => {
      fireEvent.click(renderResult.getByTestId('confirmModalConfirmButton'));
    });

    waitFor(() => {
      expect(useCoreMock.services.sessions.reload).toHaveBeenCalled();
    });
  });
});
