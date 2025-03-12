/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { processInputQuestion } from './text_to_ppl_task';

describe('processInputQuestion', () => {
  it('should return consistent instructions if error or fail keyword exists', () => {
    expect(processInputQuestion('show me Errors by day in the last 7 days?')).toMatchInlineSnapshot(
      `"show me Errors by day in the last 7 days?. If you're dealing logs with http response code, then error usually refers to http response code like 4xx, 5xx"`
    );

    expect(processInputQuestion('how many Failed logs in January')).toMatchInlineSnapshot(
      `"how many Failed logs in January. If you're dealing logs with http response code, then error usually refers to http response code like 4xx, 5xx"`
    );
  });

  it('should return consistent instructions if no error or fail keyword exists', () => {
    expect(processInputQuestion('how many orders are sold every day')).toMatchInlineSnapshot(
      `"how many orders are sold every day"`
    );
  });
});
