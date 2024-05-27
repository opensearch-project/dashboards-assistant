/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpHandler } from '../../../../../src/core/public';
import { httpServiceMock } from '../../../../../src/core/public/mocks';
import { ConversationLoadService } from '../conversation_load_service';
import { DataSourceServiceMock } from '../data_source_service.mock';

const setup = () => {
  const http = httpServiceMock.createSetupContract();
  const conversationLoad = new ConversationLoadService(http, new DataSourceServiceMock());

  return {
    conversationLoad,
    http,
  };
};

describe('ConversationLoadService', () => {
  it('should emit loading status and call get with specific conversation id', () => {
    const { conversationLoad, http } = setup();

    conversationLoad.load('foo');
    expect(http.get).toHaveBeenCalledWith(
      '/api/assistant/conversation/foo',
      expect.objectContaining({
        signal: expect.anything(),
      })
    );
    expect(conversationLoad.status$.getValue()).toBe('loading');
  });

  it('should resolved with response data and "idle" status', async () => {
    const { conversationLoad, http } = setup();
    http.get.mockReturnValue(Promise.resolve({ id: '1', title: 'foo' }));

    const result = await conversationLoad.load('foo');
    expect(result).toEqual({ id: '1', title: 'foo' });
    expect(conversationLoad.status$.getValue()).toBe('idle');
  });

  it('should emit error after loading aborted', async () => {
    const { conversationLoad, http } = setup();
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
    const loadResult = conversationLoad.load('foo');
    conversationLoad.abortController?.abort();

    await loadResult;

    expect(conversationLoad.status$.getValue()).toEqual({ status: 'error', error: abortError });
  });
});
