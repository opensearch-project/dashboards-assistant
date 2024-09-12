/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, cleanup, fireEvent, waitFor, screen } from '@testing-library/react';
import { getConfigSchema, getNotifications } from '../../services';
import { GeneratePopoverBody } from './generate_popover_body';
import { HttpSetup } from '../../../../../src/core/public';
import { SUMMARY_ASSISTANT_API } from '../../../common/constants/llm';
import { UsageCollectionSetup } from '../../../../../src/plugins/usage_collection/public';

jest.mock('../../services');

const mockToasts = {
  addDanger: jest.fn(),
};

beforeEach(() => {
  (getNotifications as jest.Mock).mockImplementation(() => ({
    toasts: mockToasts,
  }));
  (getConfigSchema as jest.Mock).mockReturnValue({
    chat: { enabled: true },
  });
});

afterEach(cleanup);
const reportUiStatsMock = jest.fn();
const mockUsageCollection: UsageCollectionSetup = {
  reportUiStats: reportUiStatsMock,
  METRIC_TYPE: {
    CLICK: 'click',
  },
};
const mockPost = jest.fn();
const mockHttpSetup: HttpSetup = ({
  post: mockPost,
} as unknown) as HttpSetup; // Mocking HttpSetup

describe('GeneratePopoverBody', () => {
  const incontextInsightMock = {
    contextProvider: jest.fn(),
    suggestions: ['Test summarization question'],
    datasourceId: 'test-datasource',
    key: 'alerts',
  };

  const closePopoverMock = jest.fn();

  it('auto generates summary and insight', async () => {
    mockPost.mockImplementation((path: string, body) => {
      let value;
      switch (path) {
        case SUMMARY_ASSISTANT_API.SUMMARIZE:
          value = {
            summary: 'Generated summary content',
            insightAgentIdExists: true,
          };
          break;

        case SUMMARY_ASSISTANT_API.INSIGHT:
          value = 'Generated insight content';
          break;

        default:
          return null;
      }
      return Promise.resolve(value);
    });

    const { getByText, getByLabelText, queryByText, queryByLabelText } = render(
      <GeneratePopoverBody
        incontextInsight={incontextInsightMock}
        httpSetup={mockHttpSetup}
        closePopover={closePopoverMock}
        usageCollection={mockUsageCollection}
      />
    );

    // 1. Auto generate summary
    // title is assistant icon + 'Summary'
    expect(getByLabelText('alert-assistant')).toBeInTheDocument();
    expect(getByText('Summary')).toBeInTheDocument();
    // content is loading
    expect(getByLabelText('loading_content')).toBeInTheDocument();

    // Wait for loading to complete and summary to render
    await waitFor(() => {
      expect(getByText('Generated summary content')).toBeInTheDocument();
    });
    // loading content disappeared
    expect(queryByLabelText('loading_content')).toBeNull();
    expect(mockPost).toHaveBeenCalledWith(SUMMARY_ASSISTANT_API.SUMMARIZE, expect.any(Object));
    expect(mockToasts.addDanger).not.toHaveBeenCalled();
    // generated metric is sent
    expect(reportUiStatsMock).toHaveBeenCalledWith(
      'alertSumm',
      'click',
      expect.stringMatching(/^generated/)
    );

    // insight tip icon is visible
    const insightTipIcon = screen.getAllByLabelText('How was this generated?')[0];
    expect(insightTipIcon).toBeInTheDocument();

    // 2. Click insight tip icon to view insight
    fireEvent.click(insightTipIcon);
    // title is back button + 'Insight With RAG'
    let backButton = getByLabelText('back-to-summary');
    expect(backButton).toBeInTheDocument();
    expect(getByText('Insight With RAG')).toBeInTheDocument();

    // Wait for loading to complete and insight to render
    await waitFor(() => {
      expect(getByText('Generated insight content')).toBeInTheDocument();
    });
    expect(queryByText('Generated summary content')).toBeNull();

    // loading content disappeared
    expect(queryByLabelText('loading_content')).toBeNull();
    expect(mockPost).toHaveBeenCalledWith(SUMMARY_ASSISTANT_API.INSIGHT, expect.any(Object));
    expect(mockToasts.addDanger).not.toHaveBeenCalled();

    // 3. Click back button to view summary
    backButton = getByLabelText('back-to-summary');
    fireEvent.click(backButton);
    expect(queryByText('Generated insight content')).toBeNull();
    expect(queryByText('Generated summary content')).toBeInTheDocument();
  });

  it('auto generates summary without insight agent id', async () => {
    mockPost.mockImplementation((path: string, body) => {
      let value;
      switch (path) {
        case SUMMARY_ASSISTANT_API.SUMMARIZE:
          value = {
            summary: 'Generated summary content',
            insightAgentIdExists: false,
          };
          break;

        case SUMMARY_ASSISTANT_API.INSIGHT:
          value = 'Generated insight content';
          break;

        default:
          return null;
      }
      return Promise.resolve(value);
    });

    const { getByText, getByLabelText, queryByLabelText } = render(
      <GeneratePopoverBody
        incontextInsight={incontextInsightMock}
        httpSetup={mockHttpSetup}
        closePopover={closePopoverMock}
        usageCollection={mockUsageCollection}
      />
    );

    // title is assistant icon + 'Summary'
    expect(getByLabelText('alert-assistant')).toBeInTheDocument();
    expect(getByText('Summary')).toBeInTheDocument();
    // content is loading
    expect(getByLabelText('loading_content')).toBeInTheDocument();

    // Wait for loading to complete and summary to render
    await waitFor(() => {
      expect(getByText('Generated summary content')).toBeInTheDocument();
    });
    // loading content disappeared
    expect(queryByLabelText('loading_content')).toBeNull();
    expect(mockPost).toHaveBeenCalledWith(SUMMARY_ASSISTANT_API.SUMMARIZE, expect.any(Object));
    expect(mockToasts.addDanger).not.toHaveBeenCalled();
    // generated metric is sent
    expect(reportUiStatsMock).toHaveBeenCalledWith(
      'alertSumm',
      'click',
      expect.stringMatching(/^generated/)
    );

    // insight tip icon is not visible
    expect(screen.queryAllByLabelText('How was this generated?')).toHaveLength(0);
    // Only call http post 1 time.
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('handles error during summary generation', async () => {
    mockPost.mockRejectedValue(new Error('Network Error'));

    const { queryByText } = render(
      <GeneratePopoverBody
        aria-label="test-generated-popover"
        incontextInsight={incontextInsightMock}
        httpSetup={mockHttpSetup}
        closePopover={closePopoverMock}
      />
    );

    // Auto close popover window if error occurs
    expect(queryByText('test-generated-popover')).toBeNull();

    await waitFor(() => {
      expect(mockToasts.addDanger).toHaveBeenCalledWith('Generate summary error');
    });
  });

  it('handles error during insight generation', async () => {
    mockPost.mockImplementation((path: string, body) => {
      let value;
      switch (path) {
        case SUMMARY_ASSISTANT_API.SUMMARIZE:
          value = {
            summary: 'Generated summary content',
            insightAgentIdExists: true,
          };
          break;

        case SUMMARY_ASSISTANT_API.INSIGHT:
          return Promise.reject(new Error('Network Error'));

        default:
          return null;
      }
      return Promise.resolve(value);
    });

    const { getByText, queryByLabelText } = render(
      <GeneratePopoverBody
        aria-label="test-generated-popover"
        incontextInsight={incontextInsightMock}
        httpSetup={mockHttpSetup}
        closePopover={closePopoverMock}
      />
    );

    expect(getByText('Summary')).toBeInTheDocument();
    // Wait for loading to complete and summary to render
    await waitFor(() => {
      expect(mockToasts.addDanger).toHaveBeenCalledWith('Generate insight error');
    });
    // Show summary content although insight generation failed
    expect(getByText('Generated summary content')).toBeInTheDocument();
    // insight tip icon is not visible for this alert
    expect(screen.queryAllByLabelText('How was this generated?')).toHaveLength(0);
  });
});
