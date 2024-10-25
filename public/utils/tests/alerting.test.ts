/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { extractTimeRangeDSL } from '../alerting';

describe('extractTimeRangeDSL', () => {
  it('should only extract utc time range filter', () => {
    expect(extractTimeRangeDSL([{ range: { timestamp: { to: 'now' } } }]).timeRangeDSL).toEqual(
      undefined
    );
  });

  it('should return undefined timeFiledName if no time range filter', () => {
    expect(
      extractTimeRangeDSL([
        {
          bool: {},
        },
      ]).timeRangeDSL
    ).toBe(undefined);
  });

  it('should extract timeFiledName normally', () => {
    expect(
      extractTimeRangeDSL([
        {
          range: {
            timestamp: {
              from: '2024-10-09T17:40:47+00:00||-1h',
              to: '2024-10-09T17:40:47+00:00',
              include_lower: true,
              include_upper: true,
              boost: 1,
            },
          },
        },
        {
          bool: {
            must_not: [
              {
                match_phrase: {
                  response: {
                    query: '200',
                    slop: 0,
                    zero_terms_query: 'NONE',
                    boost: 1,
                  },
                },
              },
            ],
            adjust_pure_negative: true,
            boost: 1,
          },
        },
      ]).timeRangeDSL
    ).toStrictEqual({
      from: '2024-10-09T17:40:47+00:00||-1h',
      to: '2024-10-09T17:40:47+00:00',
      include_lower: true,
      include_upper: true,
      boost: 1,
    });
  });
});
