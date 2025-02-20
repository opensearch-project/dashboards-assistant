/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { ChatFlyout } from './chat_flyout';
import * as chatContextExports from './contexts/chat_context';
import { TAB_ID } from './utils/constants';

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

describe('<ChatFlyout />', () => {
  beforeEach(() => {
    jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue({
      setFlyoutVisible: jest.fn(),
      selectedTabId: TAB_ID.CHAT,
      interactionId: 'chat_interaction_id_mock',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should only display chat panel when current tab is TAB_ID.CHAT under non-fullscreen mode', () => {
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
      />
    );

    expect(screen.getByLabelText('chat panel').classList).not.toContain('llm-chat-hidden');
    expect(screen.getByLabelText('history panel').classList).not.toContain('llm-chat-hidden');
  });
});
