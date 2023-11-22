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
        parserProvider(interaction) {
          return Promise.resolve([
            {
              type: 'output',
              contentType: 'markdown',
              content: interaction.response,
            },
          ]);
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
        parserProvider() {
          return Promise.resolve([
            {
              type: 'output',
              contentType: 'markdown',
              content: 'A',
            },
          ]);
        },
      },
      {
        id: 'testOrder1000',
        order: 1000,
        parserProvider() {
          return Promise.resolve([
            {
              type: 'output',
              contentType: 'markdown',
              content: 'order1000',
            },
          ]);
        },
      },
      {
        id: 'testNoOrder',
        parserProvider(interaction) {
          return Promise.resolve([
            {
              type: 'output',
              contentType: 'markdown',
              content: 'NoOrder',
            },
          ]);
        },
      },
      {
        id: 'testB',
        order: 1,
        parserProvider() {
          return Promise.resolve([
            {
              type: 'output',
              contentType: 'markdown',
              content: 'B',
            },
          ]);
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
      {
        type: 'output',
        contentType: 'markdown',
        content: 'order1000',
      },
    ]);
  });
});
