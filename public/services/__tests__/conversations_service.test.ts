/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { waitFor } from '@testing-library/dom';
import { HttpHandler } from '../../../../../src/core/public';
import { httpServiceMock } from '../../../../../src/core/public/mocks';
import { ConversationsService } from '../conversations_service';
import { DataSourceServiceMock } from '../data_source_service.mock';

const setup = () => {
  const http = httpServiceMock.createSetupContract();
  const dataSourceServiceMock = new DataSourceServiceMock();
  const conversations = new ConversationsService(http, dataSourceServiceMock);

  return {
    conversations,
    http,
    dataSource: dataSourceServiceMock,
  };
};

describe('ConversationsService', () => {
  it('should emit loading status and call get with conversations API path', async () => {
    const { conversations, http } = setup();

    conversations.load();
    expect(conversations.status$.getValue()).toBe('loading');
    await waitFor(() => {
      expect(http.get).toHaveBeenCalledWith(
        '/api/assistant/conversations',
        expect.objectContaining({
          signal: expect.anything(),
        })
      );
    });
  });

  it('should update options property and call get with passed query', async () => {
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
    await waitFor(() => {
      expect(http.get).toHaveBeenCalledWith(
        '/api/assistant/conversations',
        expect.objectContaining({
          query: {
            page: 1,
            perPage: 10,
            dataSourceId: '',
          },
          signal: expect.anything(),
        })
      );
    });
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
    await waitFor(() => {
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(
        '/api/assistant/conversations',
        expect.objectContaining({
          query: {
            page: 1,
            perPage: 10,
            dataSourceId: '',
          },
          signal: expect.anything(),
        })
      );
    });
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
    await waitFor(() => {
      expect(http.get).toHaveBeenCalled();
    });
    conversations.abortController?.abort();

    await loadResult;

    expect(conversations.status$.getValue()).toEqual({ error: abortError });
    expect(conversations.conversations$.getValue()).toEqual(null);
  });
});
