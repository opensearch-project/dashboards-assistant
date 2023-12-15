/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useFetchAgentFrameworkTraces } from './use_fetch_agentframework_traces';
import { createOpenSearchDashboardsReactContext } from '../../../../src/plugins/opensearch_dashboards_react/public';
import { coreMock } from '../../../../src/core/public/mocks';
import { HttpHandler } from '../../../../src/core/public';

describe('useFetchAgentFrameworkTraces hook', () => {
  const traceId = 'foo';
  const services = coreMock.createStart();
  const { Provider } = createOpenSearchDashboardsReactContext(services);
  const wrapper = { wrapper: Provider };

  it('return undefined when trace id is not specfied', () => {
    const { result } = renderHook(() => useFetchAgentFrameworkTraces(''));
    expect(result.current).toMatchObject({
      data: undefined,
      loading: false,
    });
  });

  it('return trace data successfully', async () => {
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
      () => useFetchAgentFrameworkTraces(traceId),
      wrapper
    );

    await waitForNextUpdate();
    expect(services.http.get).toHaveBeenCalledWith(
      `/api/assistant/trace/${traceId}`,
      expect.objectContaining({
        signal: expect.any(Object),
      })
    );

    expect(result.current).toEqual({
      data: traces,
      loading: false,
    });
  });

  it('return error when fetch trace error happend', async () => {
    services.http.get.mockRejectedValue(new Error('trace not found'));
    const { result, waitForNextUpdate } = renderHook(
      () => useFetchAgentFrameworkTraces(traceId),
      wrapper
    );

    await waitForNextUpdate();

    expect(services.http.get).toHaveBeenCalledWith(
      `/api/assistant/trace/${traceId}`,
      expect.objectContaining({
        signal: expect.any(Object),
      })
    );

    expect(result.current).toEqual({
      data: undefined,
      loading: false,
      error: new Error('trace not found'),
    });
  });

  it('abort the request when unmount', async () => {
    const abortError = new Error('abort');

    services.http.get.mockImplementation(((_path, options) => {
      return new Promise((_resolve, reject) => {
        if (options?.signal) {
          options.signal.onabort = () => {
            reject(abortError);
          };
        }
      });
    }) as HttpHandler);

    const { result, unmount, waitFor } = renderHook(
      () => useFetchAgentFrameworkTraces(traceId),
      wrapper
    );

    act(() => {
      unmount();
    });

    expect(services.http.get).toHaveBeenCalledWith(
      `/api/assistant/trace/${traceId}`,
      expect.objectContaining({
        signal: expect.any(Object),
      })
    );

    waitFor(() => {
      expect(result.current).toEqual({
        data: undefined,
        loading: false,
        error: abortError,
      });
    });
  });
});
