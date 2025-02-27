/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { coreMock } from '../../../../../src/core/public/mocks';
import { ConversationLoadService } from '../../services/conversation_load_service';
import { ConversationsService } from '../../services/conversations_service';
import { ChatPage } from './chat_page';
import * as chatContextExports from '../../contexts/chat_context';
import * as coreContextExports from '../../contexts/core_context';
import * as hookExports from '../../hooks/use_chat_state';
import { DataSourceServiceMock } from '../../services/data_source_service.mock';
import { httpServiceMock } from '../../../../../src/core/public/mocks';

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
    title: 'conversation title',
    version: 1,
    createdTimeMs: new Date().getTime(),
    updatedTimeMs: new Date().getTime(),
    messages: [],
    interactions: [],
  });
  const loadMockConversations = jest.fn().mockResolvedValue({});
  const dataSourceServiceMock = new DataSourceServiceMock();
  const conversationLoadService = new ConversationLoadService(coreMock.createStart().http);
  const conversationsService = new ConversationsService(
    httpServiceMock.createStartContract(),
    dataSourceServiceMock
  );

  beforeEach(() => {
    jest.spyOn(conversationLoadService, 'load').mockImplementation(loadMock);
    jest.spyOn(conversationsService, 'load').mockImplementation(loadMockConversations);

    jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue({
      conversationId: 'mocked_conversation_id',
      chatEnabled: true,
    });

    jest.spyOn(hookExports, 'useChatState').mockReturnValue({
      chatStateDispatch: dispatchMock,
      chatState: { messages: [], llmResponding: false, interactions: [] },
    });

    jest.spyOn(coreContextExports, 'useCore').mockReturnValue({
      services: {
        conversationLoad: conversationLoadService,
        conversations: conversationsService,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should reload the current conversation when user click refresh', async () => {
    render(<ChatPage />);
    fireEvent.click(screen.getByText('refresh'));

    expect(loadMock).toHaveBeenCalledWith('mocked_conversation_id');
    await waitFor(() => {
      expect(dispatchMock).toHaveBeenCalledWith({
        type: 'receive',
        payload: { messages: [], interactions: [] },
      });
    });
  });

  it('should NOT call reload if current conversation is not set', async () => {
    jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue({
      conversationId: undefined,
      chatEnabled: true,
    });
    render(<ChatPage />);
    fireEvent.click(screen.getByText('refresh'));

    expect(loadMock).not.toHaveBeenCalled();
  });
});
