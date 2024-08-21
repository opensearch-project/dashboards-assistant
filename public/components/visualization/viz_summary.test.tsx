/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { BehaviorSubject } from 'rxjs';
import { HttpSetup } from '../../../../../src/core/public';
import { SUMMARY_ASSISTANT_API } from '../../../common/constants/llm';
import { VizSummary } from './viz_summary';
import { getAssistantRole } from '../../utils/constants';
import { getNotifications } from '../../services';

// Mock necessary functions and modules
jest.mock('../../services', () => ({
  getNotifications: jest.fn().mockReturnValue({
    toasts: {
      addDanger: jest.fn(),
    },
  }),
}));

const mockHttpPost = jest.fn();
const mockEscape = jest.fn((text) => text);
jest.mock('lodash', () => ({
  escape: (text) => mockEscape(text),
}));

describe('VizSummary', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sampleData$: BehaviorSubject<any>;
  let http: HttpSetup;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sampleData$ = new BehaviorSubject<any>(null);
    http = ({
      post: mockHttpPost,
    } as unknown) as HttpSetup;
    mockEscape.mockClear();
    mockHttpPost.mockClear();
  });

  it('renders correctly when there is no summary and not generating', () => {
    render(<VizSummary http={http} sampleData$={sampleData$} />);
    expect(screen.getByText('Ask a question to generate a summary.')).toBeInTheDocument();
  });

  it('renders correctly and firstly shows the "Generating response..." message and then show summary', async () => {
    sampleData$.next({ size: 100 });
    mockHttpPost.mockResolvedValue('Summary text');
    render(<VizSummary http={http} sampleData$={sampleData$} vizParams={{}} />);

    expect(screen.queryByText('Generating response...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Generating response...')).not.toBeInTheDocument();
      expect(screen.getByText('Summary text')).toBeInTheDocument();
    });
  });

  it('correctly sends data to the server', () => {
    const testData = { some: 'data' };
    const testParams = { test: 'params' };
    const expectedPrompt = getAssistantRole('vizSummary');

    render(
      <VizSummary http={http} sampleData$={new BehaviorSubject(testData)} vizParams={testParams} />
    );

    expect(mockHttpPost).toHaveBeenCalledWith(SUMMARY_ASSISTANT_API.SUMMARIZE_VIZ, {
      body: JSON.stringify({
        vizData: JSON.stringify(testData),
        vizParams: JSON.stringify(testParams),
        prompt: expectedPrompt,
      }),
      query: { dataSourceId: undefined },
    });
  });

  it('handles API errors gracefully', async () => {
    sampleData$.next({ size: 100 });
    mockHttpPost.mockRejectedValue(new Error('API Error'));

    render(<VizSummary http={http} sampleData$={sampleData$} vizParams={{}} />);

    // Wait for the error handling logic to be executed
    await waitFor(() => {
      expect(getNotifications().toasts.addDanger).toHaveBeenCalled();
      expect(screen.getByText('Ask a question to generate a summary.')).toBeInTheDocument();
    });
  });

  it('does not make API call if sampleData is undefined', () => {
    sampleData$.next(undefined);
    render(<VizSummary http={http} sampleData$={sampleData$} vizParams={{}} />);

    expect(mockHttpPost).not.toHaveBeenCalled();
  });

  it('does not make API call if vizParams is undefined', () => {
    sampleData$.next({ size: 100 });
    render(<VizSummary http={http} sampleData$={sampleData$} />);

    expect(mockHttpPost).not.toHaveBeenCalled();
  });
});
