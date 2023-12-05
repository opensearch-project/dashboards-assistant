/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { coreMock } from '../../../../../src/core/public/mocks';
import { SessionLoadService } from '../../services/session_load_service';
import { ChatPage } from './chat_page';
import * as contextExports from '../../contexts';
import * as hookExports from '../../hooks';

jest.mock('./controls/chat_input_controls', () => {
  return { ChatInputControls: () => <div /> };
});

jest.mock('./chat_page_content', () => {
  return {
    ChatPageContent: ({ onRefresh }: { onRefresh: () => void }) => (
      <button onClick={onRefresh}>refresh</button>
    ),
  };
});

describe('<ChatPage />', () => {
  const dispatchMock = jest.fn();
  const loadMock = jest.fn().mockResolvedValue({
    title: 'session title',
    version: 1,
    createdTimeMs: new Date().getTime(),
    updatedTimeMs: new Date().getTime(),
    messages: [],
  });
  const sessionLoadService = new SessionLoadService(coreMock.createStart().http);

  beforeEach(() => {
    jest.spyOn(sessionLoadService, 'load').mockImplementation(loadMock);

    jest.spyOn(contextExports, 'useChatContext').mockReturnValue({
      sessionId: 'mocked_session_id',
      chatEnabled: true,
    });

    jest.spyOn(hookExports, 'useChatState').mockReturnValue({
      chatStateDispatch: dispatchMock,
      chatState: { messages: [], llmResponding: false },
    });

    jest.spyOn(contextExports, 'useCore').mockReturnValue({
      services: {
        sessionLoad: sessionLoadService,
      },
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should reload the current conversation when user click refresh', async () => {
    render(<ChatPage />);
    fireEvent.click(screen.getByText('refresh'));

    expect(loadMock).toHaveBeenCalledWith('mocked_session_id');
    await waitFor(() => {
      expect(dispatchMock).toHaveBeenCalledWith({ type: 'receive', payload: [] });
    });
  });

  it('should NOT call reload if current conversation is not set', async () => {
    jest.spyOn(contextExports, 'useChatContext').mockReturnValue({
      sessionId: undefined,
      chatEnabled: true,
    });
    render(<ChatPage />);
    fireEvent.click(screen.getByText('refresh'));

    expect(loadMock).not.toHaveBeenCalled();
  });
});
