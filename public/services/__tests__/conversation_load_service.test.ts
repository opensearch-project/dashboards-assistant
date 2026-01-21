/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { waitFor } from '@testing-library/dom';
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
  it('should emit loading status and call get with specific conversation id', async () => {
    const { conversationLoad, http } = setup();

    conversationLoad.load('foo');
    expect(conversationLoad.status$.getValue()).toBe('loading');
    await waitFor(() => {
      expect(http.get).toHaveBeenCalledWith(
        '/api/assistant/conversation/foo',
        expect.objectContaining({
          signal: expect.anything(),
        })
      );
    });
  });

  it('should resolved with response data and "idle" status', async () => {
    const { conversationLoad, http } = setup();
    http.get.mockReturnValue(Promise.resolve({ id: '1', title: 'foo' }));

    const result = await conversationLoad.load('foo');
    expect(result).toEqual({ id: '1', title: 'foo' });
    expect(conversationLoad.status$.getValue()).toBe('idle');
  });

  it('should emit idle status after loading aborted', async () => {
    const { conversationLoad, http } = setup();
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
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
    await waitFor(() => {
      expect(http.get).toHaveBeenCalled();
    });
    conversationLoad.abortController?.abort();

    await loadResult;

    expect(conversationLoad.status$.getValue()).toBe('idle');
  });

  it('should emit error for non-abort errors', async () => {
    const { conversationLoad, http } = setup();
    const networkError = new Error('Network error');
    http.get.mockRejectedValue(networkError);

    await conversationLoad.load('foo');

    expect(conversationLoad.status$.getValue()).toEqual({ status: 'error', error: networkError });
  });
});
