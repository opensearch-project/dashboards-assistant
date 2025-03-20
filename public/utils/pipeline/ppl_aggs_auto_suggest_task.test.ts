/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart } from '../../../../../src/plugins/data/public';
import { PPLAggsAutoSuggestTask } from './ppl_aggs_auto_suggest_task';

describe('PPLAutoSuggestTask', () => {
  let pplAutoSuggestTask: PPLAggsAutoSuggestTask;
  let mockSearchClient: DataPublicPluginStart['search'];

  beforeEach(() => {
    // Mock the search client
    mockSearchClient = {
      search: jest.fn(),
      aggs: {
        calculateAutoTimeExpression: jest.fn(),
      },
    };
    pplAutoSuggestTask = new PPLAggsAutoSuggestTask(mockSearchClient);
  });

  it('should return original input if PPL is empty', async () => {
    const input = {
      ppl: '',
      dataSourceId: 'test-source',
    };

    const result = await pplAutoSuggestTask.execute(input);
    expect(result).toEqual(input);
  });

  it('should return original input if PPL already has aggregation', async () => {
    const input = {
      ppl: 'source = test | stats count()',
      dataSourceId: 'test-source',
    };

    const result = await pplAutoSuggestTask.execute(input);
    expect(result).toEqual(input);
  });

  it('should add simple count aggregation when no time field is provided', async () => {
    const input = {
      ppl: 'source = test',
      dataSourceId: 'test-source',
    };

    const expected = {
      ppl: 'source = test | stats count()',
      dataSourceId: 'test-source',
    };

    const result = await pplAutoSuggestTask.execute(input);
    expect(result).toEqual(expected);
  });

  it('should add time-based aggregation when time field is provided', async () => {
    const input = {
      ppl: 'source = test',
      dataSourceId: 'test-source',
      timeFiledName: 'timestamp',
    };

    // Mock successful search response
    const mockResponse = {
      rawResponse: {
        total: 1,
        jsonData: [
          {
            min: '2023-01-01',
            max: '2023-12-31',
          },
        ],
      },
    };

    mockSearchClient.search.mockReturnValue({
      toPromise: () => Promise.resolve(mockResponse),
    });
    mockSearchClient.aggs.calculateAutoTimeExpression.mockReturnValue('1d');

    const expected = {
      ppl: 'source = test | stats count() by span(timestamp, 1d)',
      dataSourceId: 'test-source',
      timeFiledName: 'timestamp',
    };

    const result = await pplAutoSuggestTask.execute(input);
    expect(result).toEqual(expected);
    expect(mockSearchClient.search).toHaveBeenCalledWith(
      {
        params: {
          body: {
            query: 'source = test | stats min(timestamp) as min, max(timestamp) as max',
          },
        },
        dataSourceId: 'test-source',
      },
      { strategy: 'pplraw' }
    );
  });

  it('should handle empty search results for time-based queries', async () => {
    const input = {
      ppl: 'source = test',
      dataSourceId: 'test-source',
      timeFiledName: 'timestamp',
    };

    // Mock empty search response
    const mockResponse = {
      rawResponse: {
        total: 0,
        jsonData: [],
      },
    };

    mockSearchClient.search.mockReturnValue({
      toPromise: () => Promise.resolve(mockResponse),
    });

    const expected = {
      ppl: 'source = test | stats count()',
      dataSourceId: 'test-source',
      timeFiledName: 'timestamp',
    };

    const result = await pplAutoSuggestTask.execute(input);
    expect(result).toEqual(expected);
  });

  it('should handle null search results for time-based queries', async () => {
    const input = {
      ppl: 'source = test',
      dataSourceId: 'test-source',
      timeFiledName: 'timestamp',
    };

    // Mock null search response
    const mockResponse = null;

    mockSearchClient.search.mockReturnValue({
      toPromise: () => Promise.resolve(mockResponse),
    });

    const expected = {
      ppl: 'source = test | stats count()',
      dataSourceId: 'test-source',
      timeFiledName: 'timestamp',
    };

    const result = await pplAutoSuggestTask.execute(input);
    expect(result).toEqual(expected);
  });

  it('should handle search errors', async () => {
    const input = {
      ppl: 'source = test',
      dataSourceId: 'test-source',
      timeFiledName: 'timestamp',
    };

    mockSearchClient.search.mockReturnValue({
      toPromise: () => Promise.reject(new Error('Search failed')),
    });

    const expected = {
      ...input,
      ppl: 'source = test | stats count()',
    };

    const result = await pplAutoSuggestTask.execute(input);
    expect(result).toEqual(expected);
  });

  describe('isPPLHasAggregation', () => {
    it('should detect stats command with various spacing', () => {
      const testCases = [
        'source = test | stats count()',
        'source = test |stats count()',
        'source = test| stats count()',
        'source = test|stats count()',
      ];

      testCases.forEach((ppl) => {
        expect(pplAutoSuggestTask.isPPLHasAggregation(ppl)).toBeTruthy();
      });
    });

    it('should return false for queries without stats', () => {
      const ppl = 'source = test | where count > 0';
      expect(pplAutoSuggestTask.isPPLHasAggregation(ppl)).toBeFalsy();
    });
  });
});
