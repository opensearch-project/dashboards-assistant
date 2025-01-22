/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { MessageBubble } from './message_bubble';
import { IOutput } from '../../../../common/types/chat_saved_object_attributes';
import * as services from '../../../services';
import * as useFeedbackHookExports from '../../../hooks/use_feed_back';
import * as useChatActionsExports from '../../../hooks/use_chat_actions';
import * as coreHookExports from '../../../contexts/core_context';

describe('<MessageBubble />', () => {
  const sendFeedbackMock = jest.fn();
  const executeActionMock = jest.fn();
  const reportUiStatsMock = jest.fn();

  beforeEach(() => {
    jest
      .spyOn(services, 'getConfigSchema')
      .mockReturnValue({ chat: { trace: true, feedback: true } });
    jest.spyOn(services, 'getLogoIcon').mockReturnValue('');
    jest
      .spyOn(useFeedbackHookExports, 'useFeedback')
      .mockReturnValue({ feedbackResult: undefined, sendFeedback: sendFeedbackMock });

    jest.spyOn(useChatActionsExports, 'useChatActions').mockReturnValue({
      send: jest.fn(),
      loadChat: jest.fn(),
      openChatUI: jest.fn(),
      executeAction: executeActionMock,
      abortAction: jest.fn(),
      regenerate: jest.fn(),
    });
    jest.spyOn(coreHookExports, 'useCore').mockReturnValue({
      services: {
        setupDeps: {
          usageCollection: {
            reportUiStats: reportUiStatsMock,
            METRIC_TYPE: {
              CLICK: 'click',
            },
          },
        },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should display message bubble', () => {
    // input message
    const { rerender } = render(
      <MessageBubble
        showActionBar={false}
        message={{ type: 'input', contentType: 'text', content: 'what indices are in my cluster?' }}
      />
    );
    expect(screen.queryAllByLabelText('chat message bubble')).toHaveLength(1);

    // output message
    rerender(
      <MessageBubble
        showActionBar={false}
        message={{
          type: 'output',
          contentType: 'markdown',
          content: 'here are the indices in your cluster: .alert',
        }}
      />
    );
    expect(screen.queryAllByLabelText('chat message bubble')).toHaveLength(1);
  });

  it('should display loading indicator', () => {
    render(<MessageBubble showActionBar={false} loading={true} />);
    expect(screen.queryAllByLabelText('chat message loading')).toHaveLength(1);
  });

  it('should display message action bar', () => {
    render(
      <MessageBubble
        showActionBar={true}
        message={{
          type: 'output',
          contentType: 'markdown',
          content: 'here are the indices in your cluster: .alert',
        }}
      />
    );
    expect(screen.queryAllByLabelText('message actions')).toHaveLength(1);
  });

  it('should NOT display message action bar', () => {
    render(
      <MessageBubble
        showActionBar={false}
        message={{
          type: 'output',
          contentType: 'markdown',
          content: 'here are the indices in your cluster: .alert',
        }}
      />
    );
    expect(screen.queryAllByLabelText('message actions')).toHaveLength(0);
  });

  it('should display action(copy message) on text output', () => {
    render(
      <MessageBubble
        showActionBar={true}
        message={{
          type: 'output',
          contentType: 'markdown',
          content: 'here are the indices in your cluster: .alert',
        }}
      />
    );
    expect(screen.queryAllByLabelText('copy message')).toHaveLength(1);
  });

  it('should NOT display action(copy message) on non-text output', () => {
    const { rerender } = render(
      <MessageBubble
        showActionBar={true}
        message={{
          type: 'output',
          contentType: 'visualization',
          content: 'vis_id_mock',
          fullWidth: true,
        }}
      />
    );
    expect(screen.queryAllByLabelText('copy message')).toHaveLength(0);

    rerender(
      <MessageBubble
        showActionBar={true}
        message={{
          type: 'output',
          contentType: 'ppl_visualization',
          content: 'vis_id_mock',
          fullWidth: true,
        }}
      />
    );
    expect(screen.queryAllByLabelText('copy message')).toHaveLength(0);
  });

  it('should display action: regenerate message', () => {
    render(
      <MessageBubble
        showActionBar={true}
        showRegenerate={true}
        message={{
          type: 'output',
          contentType: 'markdown',
          content: 'here are the indices in your cluster: .alert',
        }}
        interaction={{
          input: 'foo',
          response: 'bar',
          conversation_id: 'foo',
          interaction_id: 'bar',
          create_time: new Date().toLocaleString(),
        }}
      />
    );
    expect(screen.queryAllByLabelText('regenerate message')).toHaveLength(1);
  });

  it('should NOT display action: regenerate message', () => {
    render(
      <MessageBubble
        showActionBar={true}
        showRegenerate={false}
        message={{
          type: 'output',
          contentType: 'markdown',
          content: 'here are the indices in your cluster: .alert',
        }}
      />
    );
    expect(screen.queryAllByLabelText('regenerate message')).toHaveLength(0);
  });

  it('should display actions: thumbs up and thumbs down on markdown output', () => {
    render(
      <MessageBubble
        showActionBar={true}
        message={{
          type: 'output',
          contentType: 'markdown',
          content: 'here are the indices in your cluster: .alert',
        }}
      />
    );
    expect(screen.queryAllByLabelText('feedback thumbs up')).toHaveLength(1);
    expect(screen.queryAllByLabelText('feedback thumbs down')).toHaveLength(1);
  });

  it('should NOT display actions: thumbs up and thumbs down on non-markdown output', () => {
    render(
      <MessageBubble
        showActionBar={true}
        message={{
          type: 'output',
          contentType: 'visualization',
          content: 'vis_id_mock',
        }}
      />
    );
    expect(screen.queryAllByLabelText('feedback thumbs up')).toHaveLength(0);
    expect(screen.queryAllByLabelText('feedback thumbs down')).toHaveLength(0);
  });

  it('should send thumbs up feedback', () => {
    const message: IOutput = {
      type: 'output',
      contentType: 'markdown',
      content: 'here are the indices in your cluster: .alert',
    };
    render(<MessageBubble showActionBar={true} message={message} />);
    fireEvent.click(screen.getByLabelText('feedback thumbs up'));
    expect(sendFeedbackMock).toHaveBeenCalledWith(true, message);
  });

  it('should send thumbs down feedback', () => {
    const message: IOutput = {
      type: 'output',
      contentType: 'markdown',
      content: 'here are the indices in your cluster: .alert',
    };
    render(<MessageBubble showActionBar={true} message={message} />);
    fireEvent.click(screen.getByLabelText('feedback thumbs down'));
    expect(sendFeedbackMock).toHaveBeenCalledWith(false, message);
  });

  it('should not send feedback if message has already rated', () => {
    jest
      .spyOn(useFeedbackHookExports, 'useFeedback')
      .mockReturnValue({ feedbackResult: true, sendFeedback: sendFeedbackMock });
    const message: IOutput = {
      type: 'output',
      contentType: 'markdown',
      content: 'here are the indices in your cluster: .alert',
    };
    render(<MessageBubble showActionBar={true} message={message} />);
    fireEvent.click(screen.getByLabelText('feedback thumbs up'));
    expect(sendFeedbackMock).not.toHaveBeenCalled();
  });

  it('should display action: view trace', () => {
    render(
      <MessageBubble
        showActionBar={true}
        showRegenerate={true}
        message={{
          type: 'output',
          contentType: 'markdown',
          content: 'here are the indices in your cluster: .alert',
          interactionId: 'bar',
        }}
        interaction={{
          input: 'foo',
          response: 'bar',
          conversation_id: 'foo',
          interaction_id: 'bar',
          create_time: new Date().toLocaleString(),
        }}
      />
    );
    expect(screen.getByTestId('trace-icon-bar')).toBeVisible();
    fireEvent.click(screen.getByTestId('trace-icon-bar'));
    expect(executeActionMock).toHaveBeenCalledTimes(1);
  });

  it('should NOT display action: view trace', () => {
    render(
      <MessageBubble
        showActionBar={true}
        showRegenerate={false}
        message={{
          type: 'output',
          contentType: 'markdown',
          content: 'here are the indices in your cluster: .alert',
        }}
      />
    );
    expect(screen.queryByTestId('trace-icon-bar')).toBeNull();
  });

  it('should control view trace through config flag', () => {
    render(
      <MessageBubble
        showActionBar={true}
        showRegenerate={true}
        message={{
          type: 'output',
          contentType: 'markdown',
          content: 'here are the indices in your cluster: .alert',
          interactionId: 'bar1',
        }}
        interaction={{
          input: 'foo',
          response: 'bar1',
          conversation_id: 'foo',
          interaction_id: 'bar1',
          create_time: new Date().toLocaleString(),
        }}
      />
    );
    expect(screen.queryByTestId('trace-icon-bar1')).toBeVisible();

    jest.spyOn(services, 'getConfigSchema').mockReturnValue({ chat: { trace: false } });
    render(
      <MessageBubble
        showActionBar={true}
        showRegenerate={true}
        message={{
          type: 'output',
          contentType: 'markdown',
          content: 'here are the indices in your cluster: .alert',
          interactionId: 'bar2',
        }}
        interaction={{
          input: 'foo',
          response: 'bar2',
          conversation_id: 'foo',
          interaction_id: 'bar2',
          create_time: new Date().toLocaleString(),
        }}
      />
    );
    expect(screen.queryByTestId('trace-icon-bar2')).toBeNull();
  });

  it('should control feedback buttons through config flag', () => {
    const { rerender } = render(
      <MessageBubble
        showActionBar={true}
        message={{
          type: 'output',
          contentType: 'markdown',
          content: 'here are the indices in your cluster: .alert',
        }}
      />
    );
    expect(screen.queryByLabelText('feedback thumbs down')).toBeVisible();
    expect(screen.queryByLabelText('feedback thumbs up')).toBeVisible();

    jest.spyOn(services, 'getConfigSchema').mockReturnValue({ chat: { feedback: false } });
    rerender(
      <MessageBubble
        showActionBar={true}
        message={{
          type: 'output',
          contentType: 'markdown',
          content: 'here are the indices in your cluster: .alert',
        }}
      />
    );
    expect(screen.queryByLabelText('feedback thumbs down')).toBeNull();
    expect(screen.queryByLabelText('feedback thumbs up')).toBeNull();
  });
});
