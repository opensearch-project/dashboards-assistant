/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useFetchAgentFrameworkTraces } from './use_fetch_agentframework_traces';
import { createOpenSearchDashboardsReactContext } from '../../../../src/plugins/opensearch_dashboards_react/public';
import { coreMock } from '../../../../src/core/public/mocks';
import { HttpHandler } from '../../../../src/core/public';
import { AbortError } from '../../../../src/plugins/data/common';
import { DataSourceServiceMock } from '../services/data_source_service.mock';
import { waitFor } from '@testing-library/dom';

describe('useFetchAgentFrameworkTraces hook', () => {
  const interactionId = 'foo';
  const services = coreMock.createStart();
  const mockServices = {
    ...services,
    dataSource: new DataSourceServiceMock(),
  };
  const { Provider } = createOpenSearchDashboardsReactContext(mockServices);
  const wrapper = { wrapper: Provider };

  it('return undefined when interaction id is not specfied', () => {
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
        input: 'input',
        output: 'output',
        createTime: '',
        origin: '',
        traceNumber: 1,
      },
    ];

    services.http.get.mockResolvedValueOnce(traces);
    const { result, waitForNextUpdate } = renderHook(
      () => useFetchAgentFrameworkTraces(interactionId),
      wrapper
    );

    await waitForNextUpdate();
    expect(services.http.get).toHaveBeenCalledWith(
      `/api/assistant/trace/${interactionId}`,
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
      () => useFetchAgentFrameworkTraces(interactionId),
      wrapper
    );

    await waitForNextUpdate();

    expect(services.http.get).toHaveBeenCalledWith(
      `/api/assistant/trace/${interactionId}`,
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
    const abortError = new AbortError();

    const abortFn = jest.fn();

    // @ts-ignore
    global.AbortController = jest.fn(() => ({
      abort: abortFn,
      signal: new Object(),
    }));

    services.http.get.mockImplementation(((_path, options) => {
      return new Promise((_resolve, reject) => {
        if (options?.signal) {
          options.signal.onabort = () => {
            reject(abortError);
          };
        }
      });
    }) as HttpHandler);

    const { unmount } = renderHook(() => useFetchAgentFrameworkTraces(interactionId), wrapper);

    act(() => {
      unmount();
    });

    await waitFor(() => {
      expect(services.http.get).toHaveBeenCalledWith(
        `/api/assistant/trace/${interactionId}`,
        expect.objectContaining({
          signal: expect.any(Object),
        })
      );

      // expect the mock to be called
      expect(abortFn).toBeCalledTimes(1);
    });
  });
});
