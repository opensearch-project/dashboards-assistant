/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IMessage } from 'common/types/chat_saved_object_attributes';
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
      await messageParserRunner.run(
        {
          response: 'output',
          input: 'input',
          conversation_id: '',
          interaction_id: '',
          create_time: '',
          additional_info: {},
          parent_interaction_id: '',
        },
        {
          interactions: [
            {
              response: 'output',
              input: 'input',
              conversation_id: '',
              interaction_id: '',
              create_time: '',
              additional_info: {},
              parent_interaction_id: '',
            },
          ],
        }
      )
    ).toEqual([
      {
        type: 'output',
        contentType: 'markdown',
        content: 'output',
        messageId: '_0',
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
      await messageParserRunner.run(
        {
          response: 'output',
          input: 'input',
          conversation_id: '',
          interaction_id: '',
          create_time: '',
          additional_info: {},
          parent_interaction_id: '',
        },
        {
          interactions: [
            {
              response: 'output',
              input: 'input',
              conversation_id: '',
              interaction_id: '',
              create_time: '',
              additional_info: {},
              parent_interaction_id: '',
            },
          ],
        }
      )
    ).toEqual([
      {
        type: 'output',
        contentType: 'markdown',
        content: 'B',
        messageId: '_0',
      },
      {
        type: 'output',
        contentType: 'markdown',
        content: 'A',
        messageId: '_1',
      },
      {
        type: 'output',
        contentType: 'markdown',
        content: 'NoOrder',
        messageId: '_2',
      },
      {
        type: 'output',
        contentType: 'markdown',
        content: 'order1000',
        messageId: '_3',
      },
    ]);
  });

  it('Do not append messages that are throwed with error or not an array', async () => {
    const messageParserRunner = new MessageParserRunner([
      {
        id: 'test_with_error',
        parserProvider() {
          throw new Error('error');
        },
      },
      {
        id: 'test_with_incorrect_format_of_return',
        parserProvider() {
          /**
           * The type casting is intended to test that non-array response
           * should not be parsed into final result.
           */
          return Promise.resolve(({
            type: 'output',
            contentType: 'markdown',
            content: 'order1000',
          } as unknown) as IMessage[]);
        },
      },
    ]);

    expect(
      await messageParserRunner.run(
        {
          response: 'output',
          input: 'input',
          conversation_id: '',
          interaction_id: '',
          create_time: '',
          additional_info: {},
          parent_interaction_id: '',
        },
        {
          interactions: [
            {
              response: 'output',
              input: 'input',
              conversation_id: '',
              interaction_id: '',
              create_time: '',
              additional_info: {},
              parent_interaction_id: '',
            },
          ],
        }
      )
    ).toEqual([]);
  });
});
