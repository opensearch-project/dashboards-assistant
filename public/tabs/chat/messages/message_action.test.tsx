/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { MessageActions } from './message_action';
import { useFeedback } from '../../../hooks/use_feed_back';
import { IOutput, Interaction } from '../../../../common/types/chat_saved_object_attributes';

jest.mock('../../../hooks/use_feed_back');

describe('MessageActions', () => {
  let mockUseFeedback: jest.Mock;

  beforeEach(() => {
    mockUseFeedback = useFeedback as jest.Mock;
    mockUseFeedback.mockReturnValue({
      feedbackResult: undefined,
      sendFeedback: jest.fn(),
    });
    document.execCommand = jest.fn().mockImplementation(() => true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render copy button and call copy function when clicked', () => {
    const contentToCopy = 'Test content';
    const { getByLabelText } = render(<MessageActions contentToCopy={contentToCopy} />);

    const copyButton = getByLabelText('copy message');
    fireEvent.click(copyButton);

    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('should render regenerate button and call onRegenerate function when clicked', () => {
    const onRegenerate = jest.fn();
    render(<MessageActions showRegenerate onRegenerate={onRegenerate} />);

    const regenerateButton = screen.getByLabelText('regenerate message');
    fireEvent.click(regenerateButton);

    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('should render feedback buttons and call handleFeedback function', () => {
    const interaction = { interaction_id: 'interaction1' } as Interaction;
    const message = { interactionId: 'interaction1' } as IOutput;
    const sendFeedback = jest.fn();

    mockUseFeedback.mockReturnValue({
      feedbackResult: undefined,
      sendFeedback,
    });

    render(<MessageActions interaction={interaction} message={message} showFeedback />);

    const thumbsUpButton = screen.getByLabelText('feedback thumbs up');
    const thumbsDownButton = screen.getByLabelText('feedback thumbs down');

    fireEvent.click(thumbsUpButton);
    expect(sendFeedback).toHaveBeenCalledWith(true, message);

    fireEvent.click(thumbsDownButton);
    expect(sendFeedback).toHaveBeenCalledWith(false, message);
  });

  it('should render trace icon and call onViewTrace function when clicked', () => {
    const onViewTrace = jest.fn();
    render(<MessageActions showTraceIcon traceInteractionId="trace1" onViewTrace={onViewTrace} />);

    const traceButton = screen.getByLabelText('How was this generated?');
    fireEvent.click(traceButton);

    expect(onViewTrace).toHaveBeenCalledTimes(1);
  });
});
