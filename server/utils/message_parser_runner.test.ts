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

  it('run with correct result when different order is present', async () => {
    const messageParserRunner = new MessageParserRunner([
      {
        id: 'testA',
        order: 2,
        parserProvider(interaction, messageParserHelper) {
          messageParserHelper.addMessage({
            type: 'output',
            contentType: 'markdown',
            content: 'A',
          });
          return Promise.resolve('');
        },
      },
      {
        id: 'testNoOrder',
        parserProvider(interaction, messageParserHelper) {
          messageParserHelper.addMessage({
            type: 'output',
            contentType: 'markdown',
            content: 'NoOrder',
          });
          return Promise.resolve('');
        },
      },
      {
        id: 'testB',
        order: 1,
        parserProvider(interaction, messageParserHelper) {
          messageParserHelper.addMessage({
            type: 'output',
            contentType: 'markdown',
            content: 'B',
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
        content: 'B',
      },
      {
        type: 'output',
        contentType: 'markdown',
        content: 'A',
      },
      {
        type: 'output',
        contentType: 'markdown',
        content: 'NoOrder',
      },
    ]);
  });
});
