/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, screen } from '@testing-library/react';
import { AgentFrameworkTraces } from './agent_framework_traces';
import * as GetTraces from '../hooks/use_fetch_agentframework_traces';

describe('<AgentFrameworkTraces/> spec', () => {
  it('renders the component', async () => {
    const traces = [
      {
        interactionId: 'test_interactionId',
        input: 'input',
        output: 'output',
        createTime: '',
        origin: '',
        traceNumber: 1,
      },
      {
        interactionId: 'test_interactionId',
        input: 'input',
        output: 'output',
        createTime: '',
        origin: 'CatIndexTool',
        traceNumber: 2,
      },
      {
        interactionId: 'test_interactionId',
        input: 'input',
        output: '',
        createTime: '',
        origin: '',
        traceNumber: 3,
      },
      {
        interactionId: 'test_interactionId',
        input: '',
        output: 'output',
        createTime: '',
        origin: '',
        traceNumber: 4,
      },
    ];
    const mockedGetTracesResult = {
      loading: false,
      data: traces,
    };

    jest.spyOn(GetTraces, 'useFetchAgentFrameworkTraces').mockReturnValue(mockedGetTracesResult);

    render(<AgentFrameworkTraces interactionId="test-interaction-id" />);
    expect(GetTraces.useFetchAgentFrameworkTraces).toBeCalledTimes(1);
    expect(document.body.children).toMatchSnapshot();
  });

  it('no traces available', async () => {
    jest.spyOn(GetTraces, 'useFetchAgentFrameworkTraces').mockReturnValue({
      loading: false,
      data: [],
    });
    render(<AgentFrameworkTraces interactionId="test-interaction-id" />);
    expect(screen.queryByText('Data not available.')).toBeInTheDocument();
  });

  it('show loading', async () => {
    jest.spyOn(GetTraces, 'useFetchAgentFrameworkTraces').mockReturnValue({
      loading: true,
      data: [],
    });
    render(<AgentFrameworkTraces interactionId="test-interaction-id" />);
    expect(screen.queryByText('Loading...')).toBeInTheDocument();
  });

  it('show error', async () => {
    jest.spyOn(GetTraces, 'useFetchAgentFrameworkTraces').mockReturnValue({
      loading: false,
      data: [],
      error: new Error('test'),
    });
    render(<AgentFrameworkTraces interactionId="test-interaction-id" />);
    expect(screen.queryByText('Error loading details')).toBeInTheDocument();
  });
});
