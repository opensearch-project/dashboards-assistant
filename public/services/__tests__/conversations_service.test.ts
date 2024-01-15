/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpHandler } from '../../../../../src/core/public';
import { httpServiceMock } from '../../../../../src/core/public/mocks';
import { ConversationsService } from '../conversations_service';

const setup = () => {
  const http = httpServiceMock.createSetupContract();
  const conversations = new ConversationsService(http);

  return {
    conversations,
    http,
  };
};

describe('ConversationsService', () => {
  it('should emit loading status and call get with conversations API path', () => {
    const { conversations, http } = setup();

    conversations.load();
    expect(http.get).toHaveBeenCalledWith(
      '/api/assistant/conversations',
      expect.objectContaining({
        signal: expect.anything(),
      })
    );
    expect(conversations.status$.getValue()).toBe('loading');
  });

  it('should update options property and call get with passed query', () => {
    const { conversations, http } = setup();

    expect(conversations.options).toBeFalsy();
    conversations.load({
      page: 1,
      perPage: 10,
    });
    expect(conversations.options).toEqual({
      page: 1,
      perPage: 10,
    });
    expect(http.get).toHaveBeenCalledWith(
      '/api/assistant/conversations',
      expect.objectContaining({
        query: {
          page: 1,
          perPage: 10,
        },
        signal: expect.anything(),
      })
    );
  });

  it('should emit latest conversations and "idle" status', async () => {
    const { conversations, http } = setup();
    http.get.mockReturnValue(Promise.resolve({ objects: [{ id: '1', title: 'foo' }], total: 1 }));

    await conversations.load();

    expect(conversations.status$.getValue()).toBe('idle');
    expect(conversations.conversations$.getValue()).toEqual({
      objects: [{ id: '1', title: 'foo' }],
      total: 1,
    });
  });

  it('should call get with same query again after reload called', async () => {
    const { conversations, http } = setup();

    await conversations.load({
      page: 1,
      perPage: 10,
    });
    http.get.mockClear();

    conversations.reload();
    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith(
      '/api/assistant/conversations',
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
    const { conversations, http } = setup();
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
    const loadResult = conversations.load();
    conversations.abortController?.abort();

    await loadResult;

    expect(conversations.status$.getValue()).toEqual({ error: abortError });
    expect(conversations.conversations$.getValue()).toEqual(null);
  });
});
