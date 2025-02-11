/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { ChatFlyout } from './chat_flyout';
import * as chatContextExports from './contexts/chat_context';
import { TAB_ID } from './utils/constants';
import * as useChatActionsExports from './hooks/use_chat_actions';
import { coreMock } from '../../../src/core/public/mocks';
import { HttpStart } from '../../../src/core/public';
import { ConversationsService } from './services';
import * as coreContextExports from './contexts/core_context';
import * as useChatStateExports from './hooks/use_chat_state';
import { I18nProvider } from '@osd/i18n/react';
import { ChatHistoryPage } from './tabs/history/chat_history_page';
import { Subject } from 'rxjs';

jest.mock('./tabs/chat/chat_page', () => ({
  ChatPage: () => <div aria-label="mock chat page" />,
}));

jest.mock('./tabs/chat_window_header', () => ({
  ChatWindowHeader: () => <div aria-label="mock chat window header" />,
}));

jest.mock('./tabs/history/chat_history_page', () => ({
  ChatHistoryPage: () => <div aria-label="mock chat history page" />,
}));

jest.mock('./components/agent_framework_traces_flyout_body', () => ({
  AgentFrameworkTracesFlyoutBody: () => (
    <div aria-label="mock agent framework traces flyout body" />
  ),
}));

const mockGetConversationsHttp = () => {
  const http = coreMock.createStart().http;
  http.get.mockImplementation(async () => ({
    objects: [
      {
        id: '1',
        title: 'foo',
      },
    ],
    total: 100,
  }));
  return http;
};

const setup = ({
  http = mockGetConversationsHttp(),
  chatContext = {},
  shouldRefresh = false,
}: {
  http?: HttpStart;
  chatContext?: { flyoutFullScreen?: boolean };
  shouldRefresh?: boolean;
} = {}) => {
  const dataSourceMock = {
    dataSourceIdUpdates$: new Subject<string | null>(),
    getDataSourceQuery: jest.fn(() => ({ dataSourceId: 'foo' })),
  };
  const useCoreMock = {
    services: {
      ...coreMock.createStart(),
      http,
      conversations: new ConversationsService(http, dataSourceMock),
      conversationLoad: {},
      dataSource: dataSourceMock,
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
      <ChatHistoryPage shouldRefresh={shouldRefresh} />
    </I18nProvider>
  );

  return {
    useCoreMock,
    useChatStateMock,
    useChatContextMock,
    dataSourceMock,
    renderResult,
  };
};

describe('<ChatFlyout />', () => {
  beforeEach(() => {
    jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue({
      setFlyoutVisible: jest.fn(),
      selectedTabId: TAB_ID.CHAT,
      interactionId: 'chat_interaction_id_mock',
    });

    jest.spyOn(useChatActionsExports, 'useChatActions').mockReturnValue({
      send: jest.fn(),
      loadChat: jest.fn(),
      openChatUI: jest.fn(),
      executeAction: jest.fn(),
      abortAction: jest.fn(),
      regenerate: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should only display chat panel when current tab is TAB_ID.CHAT under non-fullscreen mode', () => {
    const { useCoreMock } = setup({ shouldRefresh: true });
    jest.spyOn(useCoreMock.services.conversations, 'load').mockReturnValue(
      new Promise((resolve) => {
        resolve({
          loading: false,
          data: {
            conversations: [
              {
                id: 'conversation_id_mock',
                name: 'conversation_name_mock',
                messages: [
                  {
                    id: 'message_id_mock',
                    content: 'message_content_mock',
                    role: 'user',
                  },
                ],
              },
            ],
          },
        });
      })
    );

    jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue({
      setFlyoutVisible: jest.fn(),
      selectedTabId: TAB_ID.CHAT,
      interactionId: 'chat_interaction_id_mock',
    });

    render(
      <ChatFlyout
        flyoutVisible={true}
        overrideComponent={null}
        flyoutProps={{}}
        flyoutFullScreen={false}
        setShowWelcomePage={() => {}}
        showWelcomePage={true}
      />
    );
    expect(screen.getByLabelText('chat panel').classList).not.toContain('llm-chat-hidden');
    expect(screen.getByLabelText('history panel').classList).toContain('llm-chat-hidden');
  });

  it('should only display history panel when current tab is TAB_ID.HISTORY under non-fullscreen mode', () => {
    jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue({
      setFlyoutVisible: jest.fn(),
      selectedTabId: TAB_ID.HISTORY,
      interactionId: 'chat_interaction_id_mock',
    });

    render(
      <ChatFlyout
        flyoutVisible={true}
        overrideComponent={null}
        flyoutProps={{}}
        flyoutFullScreen={false}
        setShowWelcomePage={() => {}}
        showWelcomePage={true}
      />
    );
    expect(screen.getByLabelText('chat panel').classList).toContain('llm-chat-hidden');
    expect(screen.getByLabelText('history panel').classList).not.toContain('llm-chat-hidden');
  });

  it('should display chat history page', () => {
    jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue({
      setFlyoutVisible: jest.fn(),
      selectedTabId: TAB_ID.HISTORY,
      interactionId: 'chat_interaction_id_mock',
    });

    render(
      <ChatFlyout
        flyoutVisible={true}
        overrideComponent={null}
        flyoutProps={{}}
        flyoutFullScreen={false}
        setShowWelcomePage={() => {}}
        showWelcomePage={true}
      />
    );

    expect(screen.queryByLabelText('mock chat history page')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('mock agent framework traces flyout body')
    ).not.toBeInTheDocument();
  });

  it('should display traces page', () => {
    jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue({
      setFlyoutVisible: jest.fn(),
      selectedTabId: TAB_ID.TRACE,
      interactionId: 'chat_interaction_id_mock',
    });

    render(
      <ChatFlyout
        flyoutVisible={true}
        overrideComponent={null}
        flyoutProps={{}}
        flyoutFullScreen={false}
        setShowWelcomePage={() => {}}
        showWelcomePage={true}
      />
    );

    expect(screen.queryByLabelText('mock chat history page')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('mock agent framework traces flyout body')).toBeInTheDocument();
  });

  it('should always display chat panel when in fullscreen mode', () => {
    jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue({
      setFlyoutVisible: jest.fn(),
      // current tab is NOT chat
      selectedTabId: TAB_ID.HISTORY,
      interactionId: 'chat_interaction_id_mock',
    });

    render(
      <ChatFlyout
        flyoutVisible={true}
        overrideComponent={null}
        flyoutProps={{}}
        flyoutFullScreen={true} // fullscreen
        setShowWelcomePage={() => {}}
        showWelcomePage={true}
      />
    );

    expect(screen.getByLabelText('chat panel').classList).not.toContain('llm-chat-hidden');
    expect(screen.getByLabelText('history panel').classList).not.toContain('llm-chat-hidden');
  });
});
