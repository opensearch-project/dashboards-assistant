/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpHandler } from '../../../../../src/core/public';
import { httpServiceMock } from '../../../../../src/core/public/mocks';
import { SessionsService } from '../sessions_service';

const setup = () => {
  const http = httpServiceMock.createSetupContract();
  const sessions = new SessionsService(http);

  return {
    sessions,
    http,
  };
};

describe('SessionsService', () => {
  it('should emit loading status and call get with sessions API path', () => {
    const { sessions, http } = setup();

    sessions.load();
    expect(http.get).toHaveBeenCalledWith(
      '/api/assistant/sessions',
      expect.objectContaining({
        signal: expect.anything(),
      })
    );
    expect(sessions.status$.getValue()).toBe('loading');
  });

  it('should update options property and call get with passed query', () => {
    const { sessions, http } = setup();

    expect(sessions.options).toBeFalsy();
    sessions.load({
      page: 1,
      perPage: 10,
    });
    expect(sessions.options).toEqual({
      page: 1,
      perPage: 10,
    });
    expect(http.get).toHaveBeenCalledWith(
      '/api/assistant/sessions',
      expect.objectContaining({
        query: {
          page: 1,
          perPage: 10,
        },
        signal: expect.anything(),
      })
    );
  });

  it('should emit latest sessions and "idle" status', async () => {
    const { sessions, http } = setup();
    http.get.mockReturnValue(Promise.resolve({ objects: [{ id: '1', title: 'foo' }], total: 1 }));

    await sessions.load();

    expect(sessions.status$.getValue()).toBe('idle');
    expect(sessions.sessions$.getValue()).toEqual({
      objects: [{ id: '1', title: 'foo' }],
      total: 1,
    });
  });

  it('should call get with same query again after reload called', async () => {
    const { sessions, http } = setup();

    await sessions.load({
      page: 1,
      perPage: 10,
    });
    http.get.mockClear();

    sessions.reload();
    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith(
      '/api/assistant/sessions',
      expect.objectContaining({
        query: {
          page: 1,
          perPage: 10,
        },
        signal: expect.anything(),
      })
    );
  });

  it('should emit error after loading aborted', async () => {
    const { sessions, http } = setup();
    const abortError = new Error('Aborted');
    http.get.mockImplementation(((_path, options) => {
      return new Promise((_resolve, reject) => {
        if (options?.signal) {
          options.signal.onabort = () => {
            reject(abortError);
          };
        }
      });
    }) as HttpHandler);
    const loadResult = sessions.load();
    sessions.abortController?.abort();

    await loadResult;

    expect(sessions.status$.getValue()).toEqual({ error: abortError });
    expect(sessions.sessions$.getValue()).toEqual(null);
  });
});
