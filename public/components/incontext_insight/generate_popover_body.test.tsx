/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { getNotifications } from '../../services';
import { GeneratePopoverBody } from './generate_popover_body';
import { HttpSetup } from '../../../../../src/core/public';
import { ASSISTANT_API } from '../../../common/constants/llm';

jest.mock('../../services');

const mockToasts = {
  addDanger: jest.fn(),
};

beforeEach(() => {
  (getNotifications as jest.Mock).mockImplementation(() => ({
    toasts: mockToasts,
  }));
});

afterEach(cleanup);

const mockPost = jest.fn();
const mockHttpSetup: HttpSetup = ({
  post: mockPost,
} as unknown) as HttpSetup; // Mocking HttpSetup

describe('GeneratePopoverBody', () => {
  const incontextInsightMock = {
    contextProvider: jest.fn(),
    suggestions: ['Test summarization question'],
    datasourceId: 'test-datasource',
    key: 'test-key',
  };

  const closePopoverMock = jest.fn();

  it('renders the generate summary button', () => {
    const { getByText } = render(
      <GeneratePopoverBody
        incontextInsight={incontextInsightMock}
        httpSetup={mockHttpSetup}
        registry={undefined}
        closePopover={closePopoverMock}
      />
    );

    expect(getByText('Generate summary')).toBeInTheDocument();
  });

  it('calls onGenerateSummary when button is clicked', async () => {
    mockPost.mockResolvedValue({
      interactions: [{ conversation_id: 'test-conversation' }],
      messages: [{ type: 'output', content: 'Generated summary content' }],
    });

    const { getByText } = render(
      <GeneratePopoverBody
        incontextInsight={incontextInsightMock}
        httpSetup={mockHttpSetup}
        registry={undefined}
        closePopover={closePopoverMock}
      />
    );

    const button = getByText('Generate summary');
    fireEvent.click(button);

    // Wait for loading to complete and summary to render
    await waitFor(() => {
      expect(getByText('Generated summary content')).toBeInTheDocument();
    });

    expect(mockPost).toHaveBeenCalledWith(ASSISTANT_API.SEND_MESSAGE, expect.any(Object));
    expect(mockToasts.addDanger).not.toHaveBeenCalled();
  });

  it('shows loading state while generating summary', async () => {
    const { getByText } = render(
      <GeneratePopoverBody
        incontextInsight={incontextInsightMock}
        httpSetup={mockHttpSetup}
        registry={undefined}
        closePopover={closePopoverMock}
      />
    );

    const button = getByText('Generate summary');
    fireEvent.click(button);

    // Wait for loading state to appear
    expect(getByText('Generating summary...')).toBeInTheDocument();
  });

  it('handles error during summary generation', async () => {
    mockPost.mockRejectedValue(new Error('Network Error'));

    const { getByText } = render(
      <GeneratePopoverBody
        incontextInsight={incontextInsightMock}
        httpSetup={mockHttpSetup}
        registry={undefined}
        closePopover={closePopoverMock}
      />
    );

    const button = getByText('Generate summary');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockToasts.addDanger).toHaveBeenCalledWith('Generate summary error');
    });
  });

  it('renders the continue in chat button after summary is generated', async () => {
    mockPost.mockResolvedValue({
      interactions: [{ conversation_id: 'test-conversation' }],
      messages: [{ type: 'output', content: 'Generated summary content' }],
    });

    const { getByText } = render(
      <GeneratePopoverBody
        incontextInsight={incontextInsightMock}
        httpSetup={mockHttpSetup}
        registry={undefined}
        closePopover={closePopoverMock}
      />
    );

    const button = getByText('Generate summary');
    fireEvent.click(button);

    // Wait for the summary to be displayed
    await waitFor(() => {
      expect(getByText('Generated summary content')).toBeInTheDocument();
    });

    // Check for continue in chat button
    expect(getByText('Continue in chat')).toBeInTheDocument();
  });

  it('calls onChatContinuation when continue in chat button is clicked', async () => {
    mockPost.mockResolvedValue({
      interactions: [{ conversation_id: 'test-conversation' }],
      messages: [{ type: 'output', content: 'Generated summary content' }],
    });

    const { getByText } = render(
      <GeneratePopoverBody
        incontextInsight={incontextInsightMock}
        httpSetup={mockHttpSetup}
        registry={undefined}
        closePopover={closePopoverMock}
      />
    );

    const button = getByText('Generate summary');
    fireEvent.click(button);

    await waitFor(() => {
      expect(getByText('Generated summary content')).toBeInTheDocument();
    });

    const continueButton = getByText('Continue in chat');
    fireEvent.click(continueButton);

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(closePopoverMock).toHaveBeenCalled();
  });
});
