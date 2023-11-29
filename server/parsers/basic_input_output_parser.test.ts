/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BasicInputOutputParser } from './basic_input_output_parser';

describe('BasicInputOutputParser', () => {
  it('return input and output', async () => {
    expect(
      await BasicInputOutputParser.parserProvider({
        input: 'input',
        response: 'response',
        conversation_id: '',
        interaction_id: 'interaction_id',
        create_time: '',
      })
    ).toEqual([
      {
        type: 'input',
        contentType: 'text',
        content: 'input',
      },
      {
        type: 'output',
        contentType: 'markdown',
        content: 'response',
        traceId: 'interaction_id',
      },
    ]);
  });
});
