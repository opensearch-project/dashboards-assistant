/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { detectIndexType } from './index_type_detect';
import { AssistantClient } from '../services/assistant_client';
import { OpenSearchClient } from '../../../../src/core/server';
import { getIndexCache, setIndexCache } from './index_cache';

jest.mock('./index_cache');

describe('detectIndexType', () => {
  let mockClient: jest.Mocked<OpenSearchClient['transport']>;
  let mockAssistantClient: jest.Mocked<AssistantClient>;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock OpenSearch client
    mockClient = {
      request: jest.fn(),
    } as jest.Mocked<OpenSearchClient['transport']>;

    // Mock Assistant client
    mockAssistantClient = {
      executeAgentByConfigName: jest.fn(),
    } as jest.Mocked<AssistantClient>;

    // Mock cache functions
    (getIndexCache as jest.Mock).mockReset();
    (setIndexCache as jest.Mock).mockReset();
  });

  it('should return cached result if available', async () => {
    const mockCache = { isLogRelated: true };
    (getIndexCache as jest.Mock).mockReturnValue(mockCache);

    const result = await detectIndexType(
      mockClient,
      mockAssistantClient,
      'test-index',
      'test-source'
    );

    expect(result).toBe(true);
    expect(getIndexCache).toHaveBeenCalledWith('test-index', 'test-source');
    expect(mockClient.request).not.toHaveBeenCalled();
  });

  it('should detect index type when cache is not available', async () => {
    // Mock cache miss
    (getIndexCache as jest.Mock).mockReturnValue(null);

    // Mock mapping response
    mockClient.request.mockImplementation((params) => {
      if (params.path.includes('_mapping')) {
        return Promise.resolve({
          body: {
            'test-index': {
              mappings: {
                properties: {
                  timestamp: { type: 'date' },
                  message: { type: 'text' },
                },
              },
            },
          },
        });
      }
      // Mock search response
      return Promise.resolve({
        body: {
          hits: {
            hits: [{ _source: { timestamp: '2023-01-01', message: 'test log' } }],
          },
        },
      });
    });

    // Mock assistant client response
    mockAssistantClient.executeAgentByConfigName.mockResolvedValue({
      body: {
        inference_results: [
          {
            output: [
              {
                result: JSON.stringify({
                  isRelated: true,
                  reason: 'Contains typical log fields',
                }),
              },
            ],
          },
        ],
      },
    });

    const result = await detectIndexType(
      mockClient,
      mockAssistantClient,
      'test-index',
      'test-source'
    );

    expect(result).toBe(true);
    expect(mockClient.request).toHaveBeenCalledTimes(2);
    expect(mockAssistantClient.executeAgentByConfigName).toHaveBeenCalled();
    expect(setIndexCache).toHaveBeenCalled();
  });

  it('should handle error cases', async () => {
    (getIndexCache as jest.Mock).mockReturnValue(null);
    mockClient.request.mockRejectedValue(new Error('Search failed'));

    await expect(
      detectIndexType(mockClient, mockAssistantClient, 'test-index', 'test-source')
    ).rejects.toThrow('Search failed');
  });

  it('should handle undefined dataSourceId', async () => {
    (getIndexCache as jest.Mock).mockReturnValue(null);

    mockClient.request.mockImplementation((params) => {
      if (params.path.includes('_mapping')) {
        return Promise.resolve({
          body: {
            'test-index': {
              mappings: {
                properties: {},
              },
            },
          },
        });
      }
      return Promise.resolve({
        body: {
          hits: {
            hits: [],
          },
        },
      });
    });

    mockAssistantClient.executeAgentByConfigName.mockResolvedValue({
      body: {
        inference_results: [
          {
            output: [
              {
                result: JSON.stringify({
                  isRelated: false,
                  reason: 'No log patterns found',
                }),
              },
            ],
          },
        ],
      },
    });

    const result = await detectIndexType(mockClient, mockAssistantClient, 'test-index', undefined);

    expect(result).toBe(false);
    expect(setIndexCache).toHaveBeenCalledWith(expect.anything(), 'test-index', '');
  });
});
