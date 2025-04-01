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
import { usageCollectionPluginMock } from '../../../../../src/plugins/usage_collection/public/mocks';
import { coreMock } from '../../../../../src/core/public/mocks';
import { dataPluginMock } from '../../../../../src/plugins/data/public/mocks';

jest.mock('../../services');

jest.mock('../../utils', () => {
  const originUtils = jest.requireActual('../../utils');
  return {
    ...originUtils,
    createIndexPatterns: jest.fn().mockResolvedValue('index pattern'),
    buildUrlQuery: jest.fn().mockResolvedValue('query'),
  };
});

jest.spyOn(window, 'open').mockImplementation(() => null);

jest.mock('../../../../../src/core/public/utils', () => ({
  ...jest.requireActual('../../../../../src/core/public/utils'),
  formatUrlWithWorkspaceId: jest.fn().mockReturnValue('formattedUrl'),
}));

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
const mockUsageCollection = usageCollectionPluginMock.createSetupContract();
const mockPost = jest.fn();
const mockHttpSetup: HttpSetup = ({
  post: mockPost,
} as unknown) as HttpSetup; // Mocking HttpSetup

const mockDSL = `{
    "query": {
        "bool": {
            "filter": [
                {
                    "range": {
                        "timestamp": {
                            "from": "2024-09-06T04:02:52||-1h",
                            "to": "2024-10-09T17:40:47+00:00",
                            "include_lower": true,
                            "include_upper": true,
                            "boost": 1
                        }
                    }
                },
                {
                    "term": {
                        "FlightDelay": {
                            "value": "true",
                            "boost": 1
                        }
                    }
                }
            ],
            "adjust_pure_negative": true,
            "boost": 1
        }
    }
}`;

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
    // content is loading
    expect(getByLabelText('loading_content')).toBeInTheDocument();

    // Wait for loading to complete and summary to render
    await waitFor(() => {
      // title is assistant icon + 'Summary'
      expect(getByLabelText('alert-assistant')).toBeInTheDocument();
      expect(getByText('Summary')).toBeInTheDocument();

      expect(getByText('Generated summary content')).toBeInTheDocument();
    });
    // loading content disappeared
    expect(queryByLabelText('loading_content')).toBeNull();
    expect(mockPost).toHaveBeenCalledWith(SUMMARY_ASSISTANT_API.SUMMARIZE, expect.any(Object));
    expect(mockToasts.addDanger).not.toHaveBeenCalled();
    // generated metric is sent
    expect(mockUsageCollection.reportUiStats).toHaveBeenCalledWith(
      'alertSummary',
      'count',
      expect.stringMatching(/^generated/)
    );

    // insight button is visible
    const insightButton = screen.getAllByText('View insights')[0];
    expect(insightButton).toBeInTheDocument();

    // 2. Click insight button to view insights
    fireEvent.click(insightButton);
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

    // content is loading
    expect(getByLabelText('loading_content')).toBeInTheDocument();

    // Wait for loading to complete and summary to render
    await waitFor(() => {
      // title is assistant icon + 'Summary'
      expect(getByLabelText('alert-assistant')).toBeInTheDocument();
      expect(getByText('Summary')).toBeInTheDocument();

      expect(getByText('Generated summary content')).toBeInTheDocument();
    });
    // loading content disappeared
    expect(queryByLabelText('loading_content')).toBeNull();
    expect(mockPost).toHaveBeenCalledWith(SUMMARY_ASSISTANT_API.SUMMARIZE, expect.any(Object));
    expect(mockToasts.addDanger).not.toHaveBeenCalled();
    // generated metric is sent
    expect(mockUsageCollection.reportUiStats).toHaveBeenCalledWith(
      'alertSummary',
      'count',
      expect.stringMatching(/^generated/)
    );

    // insight button is not visible
    expect(screen.queryAllByLabelText('View insights')).toHaveLength(0);
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
    // insight button is not visible for this alert
    expect(screen.queryAllByLabelText('View insights')).toHaveLength(0);
  });

  it('should not display discover link if monitor type is not  query_level_monitor or bucket_level_monitor', async () => {
    incontextInsightMock.contextProvider = jest.fn().mockResolvedValue({
      additionalInfo: {
        dsl: mockDSL,
        index: 'mock_index',
        dataSourceId: `test-data-source-id`,
        monitorType: 'mock_type',
      },
    });
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

    const { queryByText } = render(
      <GeneratePopoverBody
        incontextInsight={incontextInsightMock}
        httpSetup={mockHttpSetup}
        closePopover={closePopoverMock}
      />
    );

    await waitFor(() => {
      expect(queryByText('View in Discover')).not.toBeInTheDocument();
    });
  });

  it('handle navigate to discover after clicking link', async () => {
    incontextInsightMock.contextProvider = jest.fn().mockResolvedValue({
      additionalInfo: {
        dsl: mockDSL,
        index: 'mock_index',
        dataSourceId: `test-data-source-id`,
        monitorType: 'query_level_monitor',
        isVisualEditorMonitor: true,
      },
    });
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

    const coreStart = coreMock.createStart();
    const dataStart = dataPluginMock.createStartContract();
    const getStartServices = jest.fn().mockResolvedValue([
      coreStart,
      {
        data: dataStart,
      },
    ]);
    const { getByText } = render(
      <GeneratePopoverBody
        incontextInsight={incontextInsightMock}
        httpSetup={mockHttpSetup}
        closePopover={closePopoverMock}
        getStartServices={getStartServices}
      />
    );

    await waitFor(() => {
      const button = getByText('View in Discover');
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
    });
    expect(window.open).toHaveBeenCalledWith('formattedUrl', '_blank');
  });

  it('should hide navigate to discover if not from visual editor monitor', async () => {
    incontextInsightMock.contextProvider = jest.fn().mockResolvedValue({
      additionalInfo: {
        dsl: mockDSL,
        index: 'mock_index',
        dataSourceId: `test-data-source-id`,
        monitorType: 'query_level_monitor',
        isVisualEditorMonitor: false,
      },
    });
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

    const coreStart = coreMock.createStart();
    const dataStart = dataPluginMock.createStartContract();
    const getStartServices = jest.fn().mockResolvedValue([
      coreStart,
      {
        data: dataStart,
      },
    ]);
    const { queryByText } = render(
      <GeneratePopoverBody
        incontextInsight={incontextInsightMock}
        httpSetup={mockHttpSetup}
        closePopover={closePopoverMock}
        getStartServices={getStartServices}
      />
    );

    await waitFor(() => {
      expect(queryByText('View in Discover')).not.toBeInTheDocument();
    });
  });
});
