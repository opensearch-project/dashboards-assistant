/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatPageContent } from './chat_page_content';
import * as chatContextExports from '../../contexts/chat_context';
import * as chatStateHookExports from '../../hooks/use_chat_state';
import * as chatActionHookExports from '../../hooks/use_chat_actions';
import { IMessage } from '../../../common/types/chat_saved_object_attributes';
import { getIncontextInsightRegistry } from '../../services';
import { setupConfigSchemaMock } from '../../../test/config_schema_mock';

jest.mock('../../services');

jest.mock('./messages/message_bubble', () => {
  return {
    MessageBubble: ({
      children,
      showRegenerate,
    }: {
      children?: React.ReactNode;
      showRegenerate?: boolean;
    }) => (
      <div aria-label="chat message bubble" data-test-subj={`showRegenerate-${showRegenerate}`}>
        {children}
      </div>
    ),
  };
});

jest.mock('./messages/message_content', () => {
  return { MessageContent: () => <div /> };
});

beforeEach(() => {
  (getIncontextInsightRegistry as jest.Mock).mockImplementation(() => ({
    setSuggestionsByInteractionId: jest.fn(),
    setInteractionId: jest.fn(),
  }));
});

const mockChatScrollTopRef = {
  current: {
    height: 500,
    scrollTop: 500,
  },
};

describe('<ChatPageContent />', () => {
  const abortActionMock = jest.fn();
  const executeActionMock = jest.fn();

  beforeAll(() => {
    setupConfigSchemaMock();
  });

  beforeEach(() => {
    jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue({
      conversationId: 'test_conversation_id',
      actionExecutors: {
        view_ppl_visualization: jest.fn(),
      },
      currentAccount: {
        username: 'test_user',
      },
    });

    jest.spyOn(chatStateHookExports, 'useChatState').mockReturnValue({
      chatState: { messages: [], llmResponding: false, interactions: [] },
      chatStateDispatch: jest.fn(),
    });

    jest.spyOn(chatActionHookExports, 'useChatActions').mockReturnValue({
      regenerate: jest.fn(),
      send: jest.fn(),
      loadChat: jest.fn(),
      openChatUI: jest.fn(),
      executeAction: executeActionMock,
      abortAction: abortActionMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should display welcome message by default', () => {
    render(
      <ChatPageContent
        messagesLoading={false}
        conversationsLoading={false}
        chatScrollTopRef={mockChatScrollTopRef}
        onRefreshConversation={jest.fn()}
        onRefreshConversationsList={jest.fn()}
      />
    );
    expect(screen.queryAllByLabelText('chat message bubble')).toHaveLength(1);
    expect(screen.queryByLabelText('chat welcome message')).toBeInTheDocument();
  });

  it('should display a default suggested action', () => {
    render(
      <ChatPageContent
        messagesLoading={false}
        conversationsLoading={false}
        chatScrollTopRef={mockChatScrollTopRef}
        onRefreshConversation={jest.fn()}
        onRefreshConversationsList={jest.fn()}
      />
    );
    expect(screen.queryAllByLabelText('chat suggestions')).toHaveLength(1);
    expect(screen.queryByText('What are the indices in my cluster?')).toBeInTheDocument();
  });

  it('should display messages', () => {
    const messages: IMessage[] = [
      {
        type: 'input',
        content: 'what indices are in my cluster?',
        contentType: 'text',
      },
      {
        type: 'output',
        content: 'here are the indices in your cluster: .alert',
        contentType: 'markdown',
        suggestedActions: [{ actionType: 'send_as_input', message: 'suggested action mock' }],
      },
    ];
    jest.spyOn(chatStateHookExports, 'useChatState').mockReturnValue({
      chatState: { messages, llmResponding: false, interactions: [] },
      chatStateDispatch: jest.fn(),
    });
    render(
      <ChatPageContent
        messagesLoading={false}
        conversationsLoading={false}
        chatScrollTopRef={mockChatScrollTopRef}
        onRefreshConversation={jest.fn()}
        onRefreshConversationsList={jest.fn()}
      />
    );
    expect(screen.queryAllByLabelText('chat message bubble')).toHaveLength(3);
  });

  it('should only display the suggested actions of last output', () => {
    const messages: IMessage[] = [
      {
        type: 'input',
        content: 'what indices are in my cluster?',
        contentType: 'text',
      },
      {
        type: 'output',
        content: 'here are the indices in your cluster: .kibana',
        contentType: 'markdown',
        suggestedActions: [{ actionType: 'send_as_input', message: 'suggested action mock' }],
      },
      {
        type: 'input',
        content: 'Are there any alerts in my system?',
        contentType: 'text',
      },
      {
        type: 'output',
        content: 'there is no alert in the system',
        contentType: 'markdown',
        suggestedActions: [{ actionType: 'send_as_input', message: 'suggested action mock' }],
      },
    ];
    jest.spyOn(chatStateHookExports, 'useChatState').mockReturnValue({
      chatState: { messages, llmResponding: false, interactions: [] },
      chatStateDispatch: jest.fn(),
    });
    render(
      <ChatPageContent
        messagesLoading={false}
        conversationsLoading={false}
        chatScrollTopRef={mockChatScrollTopRef}
        onRefreshConversation={jest.fn()}
        onRefreshConversationsList={jest.fn()}
      />
    );
    expect(screen.queryAllByLabelText('chat suggestions')).toHaveLength(1);
    expect(screen.queryByText('suggested action mock')).toBeInTheDocument();
  });

  it('should NOT display the suggested actions if no suggested actions', () => {
    const messages: IMessage[] = [
      {
        type: 'input',
        content: 'what indices are in my cluster?',
        contentType: 'text',
      },
      {
        type: 'output',
        content: 'here are the indices in your cluster: .kibana',
        contentType: 'markdown',
        suggestedActions: [],
      },
    ];
    jest.spyOn(chatStateHookExports, 'useChatState').mockReturnValue({
      chatState: { messages, llmResponding: false, interactions: [] },
      chatStateDispatch: jest.fn(),
    });
    render(
      <ChatPageContent
        messagesLoading={false}
        conversationsLoading={false}
        chatScrollTopRef={mockChatScrollTopRef}
        onRefreshConversation={jest.fn()}
        onRefreshConversationsList={jest.fn()}
      />
    );
    expect(screen.queryAllByLabelText('chat suggestions')).toHaveLength(0);
  });

  it('should not display suggested actions on user input message bubble', () => {
    const messages: IMessage[] = [
      {
        type: 'input',
        content: 'what indices are in my cluster?',
        contentType: 'text',
      },
      {
        type: 'output',
        content: 'here are the indices in your cluster: .kibana',
        contentType: 'markdown',
        suggestedActions: [{ actionType: 'send_as_input', message: 'suggested action mock' }],
      },
      {
        type: 'input',
        content: 'show me visualizations about sales',
        contentType: 'text',
      },
    ];
    jest.spyOn(chatStateHookExports, 'useChatState').mockReturnValue({
      chatState: { messages, llmResponding: false, interactions: [] },
      chatStateDispatch: jest.fn(),
    });
    render(
      <ChatPageContent
        messagesLoading={false}
        conversationsLoading={false}
        chatScrollTopRef={mockChatScrollTopRef}
        onRefreshConversation={jest.fn()}
        onRefreshConversationsList={jest.fn()}
      />
    );
    expect(screen.queryAllByLabelText('chat suggestions')).toHaveLength(0);
  });

  it('should display loading screen when loading the messages', () => {
    render(
      <ChatPageContent
        messagesLoading={true}
        conversationsLoading={false}
        chatScrollTopRef={mockChatScrollTopRef}
        onRefreshConversation={jest.fn()}
        onRefreshConversationsList={jest.fn()}
      />
    );
    expect(screen.queryByText('Loading conversation')).toBeInTheDocument();
    expect(screen.queryAllByLabelText('chat message bubble')).toHaveLength(0);
  });

  it('should show error message with refresh button', () => {
    const onRefreshMock = jest.fn();
    render(
      <ChatPageContent
        messagesLoading={false}
        conversationsLoading={false}
        chatScrollTopRef={mockChatScrollTopRef}
        messagesLoadingError={new Error('failed to get response')}
        onRefreshConversation={onRefreshMock}
        onRefreshConversationsList={onRefreshMock}
      />
    );
    expect(screen.queryByText('failed to get response')).toBeInTheDocument();
    expect(screen.queryAllByLabelText('chat message bubble')).toHaveLength(0);

    fireEvent.click(screen.getByText('Refresh'));
    expect(onRefreshMock).toHaveBeenCalled();
  });

  it('should display `Stop generating response` when llm is responding', () => {
    jest.spyOn(chatStateHookExports, 'useChatState').mockReturnValue({
      chatState: { messages: [], llmResponding: true, interactions: [] },
      chatStateDispatch: jest.fn(),
    });
    render(
      <ChatPageContent
        messagesLoading={false}
        conversationsLoading={false}
        chatScrollTopRef={mockChatScrollTopRef}
        onRefreshConversation={jest.fn()}
        onRefreshConversationsList={jest.fn()}
      />
    );
    expect(screen.queryByText('Stop generating response')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Stop generating response'));
    expect(abortActionMock).toHaveBeenCalledWith('test_conversation_id');
  });

  it('should call executeAction', () => {
    render(
      <ChatPageContent
        messagesLoading={false}
        conversationsLoading={false}
        chatScrollTopRef={mockChatScrollTopRef}
        onRefreshConversation={jest.fn()}
        onRefreshConversationsList={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText('What are the indices in my cluster?'));
    expect(executeActionMock).toHaveBeenCalled();
  });

  it('should not show regenerate button when feature flag is false', () => {
    setupConfigSchemaMock({
      chat: {
        regenerateMessage: false,
      },
    });

    jest.spyOn(chatStateHookExports, 'useChatState').mockReturnValue({
      chatState: {
        messages: [
          {
            type: 'input',
            content: 'what indices are in my cluster?',
            contentType: 'text',
          },
          {
            type: 'output',
            content: 'here are the indices in your cluster: .kibana',
            contentType: 'markdown',
            suggestedActions: [{ actionType: 'send_as_input', message: 'suggested action mock' }],
          },
        ],
        llmResponding: true,
        interactions: [],
      },
      chatStateDispatch: jest.fn(),
    });

    const { queryAllByTestId } = render(
      <ChatPageContent
        messagesLoading={false}
        conversationsLoading={false}
        chatScrollTopRef={mockChatScrollTopRef}
        onRefreshConversation={jest.fn()}
        onRefreshConversationsList={jest.fn()}
      />
    );
    expect(queryAllByTestId(`showRegenerate-false`).length).toEqual(2);
  });
});
