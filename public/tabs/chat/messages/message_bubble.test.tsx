/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { MessageBubble } from './message_bubble';
import { IOutput } from '../../../../common/types/chat_saved_object_attributes';
import * as useFeedbackHookExports from '../../../hooks/use_feed_back';

describe('<MessageBubble />', () => {
  const sendFeedbackMock = jest.fn();

  beforeEach(() => {
    jest
      .spyOn(useFeedbackHookExports, 'useFeedback')
      .mockReturnValue({ feedbackResult: undefined, sendFeedback: sendFeedbackMock });
  });

  afterEach(() => {
    jest.resetAllMocks();
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
    expect(screen.queryAllByTitle('copy message')).toHaveLength(1);
  });

  it('should NOT display action(copy message) on non-text output', () => {
    const { rerender } = render(
      <MessageBubble
        showActionBar={true}
        message={{
          type: 'output',
          contentType: 'visualization',
          content: 'vis_id_mock',
        }}
      />
    );
    expect(screen.queryAllByTitle('copy message')).toHaveLength(0);

    rerender(
      <MessageBubble
        showActionBar={true}
        message={{
          type: 'output',
          contentType: 'ppl_visualization',
          content: 'vis_id_mock',
        }}
      />
    );
    expect(screen.queryAllByTitle('copy message')).toHaveLength(0);
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
      />
    );
    expect(screen.queryAllByTitle('regenerate message')).toHaveLength(1);
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
    expect(screen.queryAllByTitle('regenerate message')).toHaveLength(0);
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
    expect(sendFeedbackMock).toHaveBeenCalledWith(message, true);
  });

  it('should send thumbs down feedback', () => {
    const message: IOutput = {
      type: 'output',
      contentType: 'markdown',
      content: 'here are the indices in your cluster: .alert',
    };
    render(<MessageBubble showActionBar={true} message={message} />);
    fireEvent.click(screen.getByLabelText('feedback thumbs down'));
    expect(sendFeedbackMock).toHaveBeenCalledWith(message, false);
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
});
