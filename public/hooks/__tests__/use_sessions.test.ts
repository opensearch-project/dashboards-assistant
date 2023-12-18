/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useDeleteSession, usePatchSession } from '../use_sessions';
import { renderHook, act } from '@testing-library/react-hooks';
import { useCore } from '../../contexts/core_context';
import { HttpHandler } from '../../../../../src/core/public';

jest.mock('../../contexts/core_context');
const useCoreMocked = useCore as jest.MockedFunction<typeof useCore>;

describe('useDeleteSession', () => {
  it('should call delete with path and signal', async () => {
    const { result } = renderHook(() => useDeleteSession());

    await act(async () => {
      await result.current.deleteSession('foo');
    });
    expect(useCoreMocked.mock.results[0].value.services.http.delete).toHaveBeenCalledWith(
      '/api/assistant/session/foo',
      expect.objectContaining({
        signal: expect.any(Object),
      })
    );
  });

  it('should be loading after deleteSession called', async () => {
    const { result, waitFor } = renderHook(() => useDeleteSession());
    useCoreMocked.mock.results[0].value.services.http.delete.mockReturnValue(new Promise(() => {}));

    act(() => {
      result.current.deleteSession('foo');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });
  });

  it('should return data after delete success', async () => {
    const { result, waitFor } = renderHook(() => useDeleteSession());
    useCoreMocked.mock.results[0].value.services.http.delete.mockReturnValue(
      Promise.resolve('deleted')
    );

    act(() => {
      result.current.deleteSession('foo');
    });

    await waitFor(() => {
      expect(result.current.data).toBe('deleted');
      expect(result.current.loading).toBe(false);
    });
  });

  it('should throw error after abort', async () => {
    const { result, waitFor } = renderHook(() => useDeleteSession());
    const abortErrorMock = new Error('Abort');
    useCoreMocked.mock.results[0].value.services.http.delete.mockImplementation(((
      _path,
      options
    ) => {
      return new Promise((_resolve, reject) => {
        if (options?.signal) {
          options.signal.onabort = () => {
            reject(abortErrorMock);
          };
        }
      });
    }) as HttpHandler);

    let deleteSessionPromise: Promise<void>;
    act(() => {
      deleteSessionPromise = result.current.deleteSession('foo');
    });

    let deleteSessionError;
    await act(async () => {
      result.current.abort();
      try {
        await deleteSessionPromise;
      } catch (error) {
        deleteSessionError = error;
      }
    });

    expect(result.current.isAborted()).toBe(true);
    expect(deleteSessionError).toBe(abortErrorMock);

    await waitFor(() => {
      expect(result.current.error).toBe(abortErrorMock);
    });
  });
});

describe('usePatchSession', () => {
  it('should call put with path, query and signal', async () => {
    const { result } = renderHook(() => usePatchSession());

    await act(async () => {
      await result.current.patchSession('foo', 'new-title');
    });
    expect(useCoreMocked.mock.results[0].value.services.http.put).toHaveBeenCalledWith(
      '/api/assistant/session/foo',
      expect.objectContaining({
        signal: expect.any(Object),
        body: JSON.stringify({ title: 'new-title' }),
      })
    );
  });

  it('should be loading after patchSession called', async () => {
    const { result, waitFor } = renderHook(() => usePatchSession());
    useCoreMocked.mock.results[0].value.services.http.put.mockReturnValue(new Promise(() => {}));

    act(() => {
      result.current.patchSession('foo', 'new-title');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });
  });

  it('should return data after patch session success', async () => {
    const { result, waitFor } = renderHook(() => usePatchSession());
    useCoreMocked.mock.results[0].value.services.http.put.mockReturnValue(
      Promise.resolve({
        title: 'new-title',
      })
    );

    act(() => {
      result.current.patchSession('foo', 'new-title');
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ title: 'new-title' });
      expect(result.current.loading).toBe(false);
    });
  });

  it('should throw error after abort', async () => {
    const { result, waitFor } = renderHook(() => usePatchSession());
    const abortErrorMock = new Error('Abort');
    useCoreMocked.mock.results[0].value.services.http.put.mockImplementation(((_path, options) => {
      return new Promise((_resolve, reject) => {
        if (options?.signal) {
          options.signal.onabort = () => {
            reject(abortErrorMock);
          };
        }
      });
    }) as HttpHandler);

    let patchSessionPromise: Promise<void>;
    act(() => {
      patchSessionPromise = result.current.patchSession('foo', 'new-title');
    });

    let patchSessionError;
    await act(async () => {
      result.current.abort();
      try {
        await patchSessionPromise;
      } catch (error) {
        patchSessionError = error;
      }
    });

    expect(result.current.isAborted()).toBe(true);
    expect(patchSessionError).toBe(abortErrorMock);

    await waitFor(() => {
      expect(result.current.error).toBe(abortErrorMock);
    });
  });
});
