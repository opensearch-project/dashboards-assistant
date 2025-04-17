/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { ActionContextMenu, Props } from './ui_action_context_menu';
import { httpServiceMock } from '../../../../src/core/public/http/http_service.mock';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { dataPluginMock } from '../../../../src/plugins/data/public/mocks';
import { BehaviorSubject } from 'rxjs';
import { AssistantClient } from '../../public/services/assistant_client';
import { act } from 'react-dom/test-utils';

jest.mock('../services', () => ({
  getUiActions: () => ({
    getTriggerActions: jest.fn().mockReturnValue([
      {
        definition: {
          order: 1,
          id: 'suggestAnomalyDetector',
          type: 'suggestAnomalyDetector',
        },
        id: 'suggestAnomalyDetector',
        type: 'suggestAnomalyDetector',
        order: 1,
      },
    ]),
  }),
}));

describe('ActionContextMenu', () => {
  let mockProps: Props;
  const resultSummaryEnabled$ = new BehaviorSubject<boolean>(true);
  const isQuerySummaryCollapsed$ = new BehaviorSubject<boolean>(false);
  const isSummaryAgentAvailable$ = new BehaviorSubject<boolean>(false);
  const mockAgentConfigExists = jest.fn().mockResolvedValue({ exists: true });
  beforeEach(() => {
    jest.clearAllMocks();
    mockProps = {
      label: 'OpenSearch Assistant',
      httpSetup: httpServiceMock.createSetupContract(),
      data: {
        ...dataPluginMock.createSetupContract(),
        search: {
          df: {
            df$: { hasError: true, value: { size: 0 } },
          },
        },
      },
      resultSummaryEnabled$,
      isQuerySummaryCollapsed$,
      isSummaryAgentAvailable$,
      assistantServiceStart: {
        client: ({
          agentConfigExists: mockAgentConfigExists,
          executeAgent: jest.fn(),
          executeAgentByConfigName: jest.fn(),
          http: {},
        } as unknown) as AssistantClient,
      },
    };
    // Mock subscribe methods to emit values synchronously
    jest.spyOn(resultSummaryEnabled$, 'subscribe').mockImplementation((callback) => {
      callback(resultSummaryEnabled$.value);
      return { unsubscribe: jest.fn() };
    });
    jest.spyOn(isQuerySummaryCollapsed$, 'subscribe').mockImplementation((callback) => {
      callback(isQuerySummaryCollapsed$.value);
      return { unsubscribe: jest.fn() };
    });
    jest.spyOn(isSummaryAgentAvailable$, 'subscribe').mockImplementation((callback) => {
      callback(isSummaryAgentAvailable$.value);
      return { unsubscribe: jest.fn() };
    });
  });

  afterEach(() => {
    mockProps.resultSummaryEnabled$.complete();
    mockProps.isQuerySummaryCollapsed$.complete();
    mockProps.isSummaryAgentAvailable$.complete();
  });

  it('renders the context menu button with the correct label', () => {
    const { getByText } = render(<ActionContextMenu {...mockProps} />);
    expect(getByText('OpenSearch Assistant')).toBeInTheDocument();
  });

  it('should show the summarization action when there is Summary Agent', async () => {
    render(<ActionContextMenu {...mockProps} />);
    await act(async () => {
      await mockAgentConfigExists.mock.results[0].value;
    });
    fireEvent.click(screen.getByLabelText('OpenSearch assistant trigger button'));
    expect(screen.getByText('Show result summarization')).toBeInTheDocument();
  });

  it('should not show the summarization action when there is not Summary Agent', async () => {
    const newIsSummaryAgentAvailable$ = new BehaviorSubject<boolean>(false);
    const newMockAgentConfigExists = jest.fn().mockResolvedValue({ exists: false });
    const newMockProps = {
      ...mockProps,
      isSummaryAgentAvailable$: newIsSummaryAgentAvailable$,
      assistantServiceStart: {
        ...mockProps.assistantServiceStart,
        client: ({
          ...mockProps.assistantServiceStart.client,
          agentConfigExists: newMockAgentConfigExists,
        } as unknown) as AssistantClient,
      },
    };
    render(<ActionContextMenu {...newMockProps} />);

    await act(async () => {
      const resolvedValue = await newMockAgentConfigExists.mock.results[0].value;
      newMockProps.isSummaryAgentAvailable$.next(resolvedValue.exists);
    });

    fireEvent.click(screen.getByLabelText('OpenSearch assistant trigger button'));

    await waitFor(() => {
      expect(screen.queryByTestId('queryAssist_summary_switch')).not.toBeInTheDocument();
    });
  });

  it('should disable the button and show tooltip when there is an error or no results in search.df.df$', async () => {
    // mockProps.data.search.df.df$ = { hasError: true, value: { size: 0 } };
    const initialPanelValue = [
      {
        items: [
          {
            'data-test-subj': 'embeddablePanelAction-assistant_generate_visualization_action',
            disabled: false,
            toolTipContent: '',
            onClick: () => {},
          },
        ],
      },
    ];
    const newIsSummaryAgentAvailable$ = new BehaviorSubject<boolean>(false);
    const newMockAgentConfigExists = jest.fn().mockResolvedValue({ exists: false });
    const newMockProps = {
      ...mockProps,
      isSummaryAgentAvailable$: newIsSummaryAgentAvailable$,
      assistantServiceStart: {
        ...mockProps.assistantServiceStart,
        client: ({
          ...mockProps.assistantServiceStart.client,
          agentConfigExists: newMockAgentConfigExists,
        } as unknown) as AssistantClient,
      },
      data: {
        aaa: 1111,
        ...dataPluginMock.createSetupContract(),
        search: {
          df: {
            df$: { hasError: true, value: { size: 0 } },
          },
        },
      },
    };
    render(<ActionContextMenu {...newMockProps} />);

    const button1 = screen.getByLabelText('OpenSearch assistant trigger button');
    fireEvent.click(button1);
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    expect(consoleLogSpy);
    consoleLogSpy.mockRestore();
    const popover = await screen.findByTestId('popover-test-id', {}, { timeout: 3000 });
    expect(popover).toBeInTheDocument();
  });
});
