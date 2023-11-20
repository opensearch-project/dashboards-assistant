/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MessageParserRunner } from './message_parser_runner';

describe('MessageParserRunner', () => {
  it('run with correct result', async () => {
    const messageParserRunner = new MessageParserRunner([
      {
        id: 'test',
        parserProvider(interaction, messageParserHelper) {
          messageParserHelper.addMessage({
            type: 'output',
            contentType: 'markdown',
            content: interaction.response,
          });
          return Promise.resolve('');
        },
      },
    ]);

    expect(
      await messageParserRunner.run({
        response: 'output',
        input: 'input',
      })
    ).toEqual([
      {
        type: 'output',
        contentType: 'markdown',
        content: 'output',
      },
    ]);
  });
});
