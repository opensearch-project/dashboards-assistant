/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act, waitFor } from '@testing-library/react';

import { useCore } from '../../contexts/core_context';
import { HttpHandler } from '../../../../../src/core/public';
import { useDeleteConversation, usePatchConversation } from '../use_conversations';

jest.mock('../../contexts/core_context');
const useCoreMocked = useCore as jest.MockedFunction<typeof useCore>;

describe('useDeleteConversation', () => {
  it('should call delete with path and signal', async () => {
    const { result } = renderHook(() => useDeleteConversation());

    await act(async () => {
      await result.current.deleteConversation('foo');
    });
    expect(useCoreMocked.mock.results[0].value.services.http.delete).toHaveBeenCalledWith(
      '/api/assistant/conversation/foo',
      expect.objectContaining({
        signal: expect.any(Object),
      })
    );
  });

  it('should be loading after deleteConversation called', async () => {
    const { result } = renderHook(() => useDeleteConversation());
    useCoreMocked.mock.results[0].value.services.http.delete.mockReturnValue(new Promise(() => {}));

    act(() => {
      result.current.deleteConversation('foo');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });
  });

  it('should return data after delete success', async () => {
    const { result } = renderHook(() => useDeleteConversation());
    useCoreMocked.mock.results[0].value.services.http.delete.mockReturnValue(
      Promise.resolve('deleted')
    );

    act(() => {
      result.current.deleteConversation('foo');
    });

    await waitFor(() => {
      expect(result.current.data).toBe('deleted');
      expect(result.current.loading).toBe(false);
    });
  });

  it('should throw error after abort', async () => {
    const { result } = renderHook(() => useDeleteConversation());
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

    let deleteConversationPromise: Promise<void>;
    act(() => {
      deleteConversationPromise = result.current.deleteConversation('foo');
    });

    await waitFor(() => {
      expect(useCoreMocked.mock.results[0].value.services.http.delete).toHaveBeenCalled();
    });

    let deleteConversationError;
    await act(async () => {
      result.current.abort();
      try {
        await deleteConversationPromise;
      } catch (error) {
        deleteConversationError = error;
      }
    });

    expect(result.current.isAborted()).toBe(true);
    expect(deleteConversationError).toBe(abortErrorMock);

    await waitFor(() => {
      expect(result.current.error).toBe(abortErrorMock);
    });
  });
});

describe('usePatchConversation', () => {
  it('should call put with path, query and signal', async () => {
    const { result } = renderHook(() => usePatchConversation());

    await act(async () => {
      await result.current.patchConversation('foo', 'new-title');
    });
    expect(useCoreMocked.mock.results[0].value.services.http.put).toHaveBeenCalledWith(
      '/api/assistant/conversation/foo',
      expect.objectContaining({
        signal: expect.any(Object),
        body: JSON.stringify({ title: 'new-title' }),
      })
    );
  });

  it('should be loading after patchConversation called', async () => {
    const { result } = renderHook(() => usePatchConversation());
    useCoreMocked.mock.results[0].value.services.http.put.mockReturnValue(new Promise(() => {}));

    act(() => {
      result.current.patchConversation('foo', 'new-title');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });
  });

  it('should return data after patch conversation success', async () => {
    const { result } = renderHook(() => usePatchConversation());
    useCoreMocked.mock.results[0].value.services.http.put.mockReturnValue(
      Promise.resolve({
        title: 'new-title',
      })
    );

    act(() => {
      result.current.patchConversation('foo', 'new-title');
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ title: 'new-title' });
      expect(result.current.loading).toBe(false);
    });
  });

  it('should throw error after abort', async () => {
    const { result } = renderHook(() => usePatchConversation());
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

    let patchConversationPromise: Promise<void>;
    act(() => {
      patchConversationPromise = result.current.patchConversation('foo', 'new-title');
    });

    await waitFor(() => {
      expect(useCoreMocked.mock.results[0].value.services.http.put).toHaveBeenCalled();
    });

    let patchConversationError;
    await act(async () => {
      result.current.abort();
      try {
        await patchConversationPromise;
      } catch (error) {
        patchConversationError = error;
      }
    });

    expect(result.current.isAborted()).toBe(true);
    expect(patchConversationError).toBe(abortErrorMock);

    await waitFor(() => {
      expect(result.current.error).toBe(abortErrorMock);
    });
  });
});
