/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpHandler } from '../../../../../src/core/public';
import { httpServiceMock } from '../../../../../src/core/public/mocks';
import { SessionLoadService } from '../session_load_service';

const setup = () => {
  const http = httpServiceMock.createSetupContract();
  const sessionLoad = new SessionLoadService(http);

  return {
    sessionLoad,
    http,
  };
};

describe('SessionLoadService', () => {
  it('should emit loading status and call get with specific session id', () => {
    const { sessionLoad, http } = setup();

    sessionLoad.load('foo');
    expect(http.get).toHaveBeenCalledWith(
      '/api/assistant/session/foo',
      expect.objectContaining({
        signal: expect.anything(),
      })
    );
    expect(sessionLoad.status$.getValue()).toBe('loading');
  });

  it('should resolved with response data and "idle" status', async () => {
    const { sessionLoad, http } = setup();
    http.get.mockReturnValue(Promise.resolve({ id: '1', title: 'foo' }));

    const result = await sessionLoad.load('foo');
    expect(result).toEqual({ id: '1', title: 'foo' });
    expect(sessionLoad.status$.getValue()).toBe('idle');
  });

  it('should emit error after loading aborted', async () => {
    const { sessionLoad, http } = setup();
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
    const loadResult = sessionLoad.load('foo');
    sessionLoad.abortController?.abort();

    await loadResult;

    expect(sessionLoad.status$.getValue()).toEqual({ status: 'error', error: abortError });
  });
});
