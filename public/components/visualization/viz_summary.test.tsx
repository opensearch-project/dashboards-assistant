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

  it('renders correctly and shows the "generating response..." message', () => {
    render(<VizSummary http={http} sampleData$={sampleData$} />);

    expect(screen.getByText('Response')).toBeInTheDocument();
    expect(screen.queryByText('generating response...')).not.toBeInTheDocument();
  });

  it('displays the summary when data is available', async () => {
    const mockSummary = 'Mock summary text';
    const mockResponse = { completion: mockSummary };

    mockHttpPost.mockResolvedValue(mockResponse);

    sampleData$.next({});

    render(<VizSummary http={http} sampleData$={sampleData$} />);

    expect(screen.getByText('Generating response...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(mockSummary)).toBeInTheDocument();
      expect(screen.queryByText('generating response...')).not.toBeInTheDocument();
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
});
