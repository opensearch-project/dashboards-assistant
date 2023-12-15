/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { useFetchAgentFrameworkTraces } from './use_fetch_agentframework_traces';
import { createOpenSearchDashboardsReactContext } from '../../../../src/plugins/opensearch_dashboards_react/public';
import { coreMock } from '../../../../src/core/public/mocks';

describe('useFetchAgentFrameworkTraces hook', () => {
  it('return undefined when trace id is not specfied', () => {
    const { result } = renderHook(() => useFetchAgentFrameworkTraces(''));
    expect(result.current).toEqual({
      data: undefined,
      loading: false,
    });
  });

  it('return trace data successfully', async () => {
    const services = coreMock.createStart();
    const { Provider: wrapper } = createOpenSearchDashboardsReactContext(services);
    const traces = [
      {
        interactionId: 'test_interactionId',
        parentInteractionId: 'test_parent_interactionId',
        input: 'input',
        output: 'output',
        createTime: '',
        origin: '',
        traceNumber: 1,
      },
    ];

    services.http.get.mockResolvedValueOnce(traces);
    const { result, waitForNextUpdate } = renderHook(
      () => useFetchAgentFrameworkTraces('traceId'),
      {
        wrapper,
      }
    );

    await waitForNextUpdate();
    expect(services.http.get).toHaveBeenCalledWith('/api/assistant/trace/traceId');

    expect(result.current).toEqual({
      data: traces,
      loading: false,
    });
  });

  it('return error when fetch trace error happend', async () => {
    const traceId = 'foo';
    const services = coreMock.createStart();
    const { Provider: wrapper } = createOpenSearchDashboardsReactContext(services);

    services.http.get.mockRejectedValue(new Error('trace not found'));
    const { result, waitForNextUpdate } = renderHook(() => useFetchAgentFrameworkTraces(traceId), {
      wrapper,
    });

    await waitForNextUpdate();

    expect(services.http.get).toHaveBeenCalledWith('/api/assistant/trace/foo');

    expect(result.current).toEqual({
      data: undefined,
      loading: false,
      error: new Error('trace not found'),
    });
  });
});
