/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useDeleteConversation, usePatchConversation } from '../use_conversations';
import { renderHook, act } from '@testing-library/react-hooks';
import { useCore } from '../../contexts/core_context';
import { HttpHandler } from '../../../../../src/core/public';
import { DataSourceServiceMock } from '../../services/data_source_service.mock';
import { httpServiceMock } from '../../../../../src/core/public/mocks';
jest.mock('../../contexts/core_context');

const setup = () => {
  const useCoreMocked = useCore as jest.MockedFunction<typeof useCore>;
  const mockedDataSource = new DataSourceServiceMock();
  const mockedHttp = httpServiceMock.createStartContract();
  mockedHttp.delete = jest.fn(() => Promise.resolve());
  mockedHttp.put = jest.fn(() => Promise.resolve());

  useCoreMocked.mockReturnValue({
    services: {
      dataSource: mockedDataSource,
      http: mockedHttp,
    },
  });

  return useCoreMocked;
};

describe('useDeleteConversation', () => {
  const useCoreMocked = setup();
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
    const { result, waitFor } = renderHook(() => useDeleteConversation());
    useCoreMocked.mock.results[0].value.services.http.delete.mockReturnValue(new Promise(() => {}));

    act(() => {
      result.current.deleteConversation('foo');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });
  });

  it('should return data after delete success', async () => {
    const { result, waitFor } = renderHook(() => useDeleteConversation());
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
    const { result, waitFor } = renderHook(() => useDeleteConversation());
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
  const useCoreMocked = setup();

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
    const { result, waitFor } = renderHook(() => usePatchConversation());
    useCoreMocked.mock.results[0].value.services.http.put.mockReturnValue(new Promise(() => {}));

    act(() => {
      result.current.patchConversation('foo', 'new-title');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });
  });

  it('should return data after patch conversation success', async () => {
    const { result, waitFor } = renderHook(() => usePatchConversation());
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
    const { result, waitFor } = renderHook(() => usePatchConversation());
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
