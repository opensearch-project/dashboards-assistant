/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BasicInputOutputParser, parseSuggestedActions } from './basic_input_output_parser';

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
        suggestedActions: [],
      },
    ]);
  });

  it('return suggestions when additional_info has related info', async () => {
    expect(
      await BasicInputOutputParser.parserProvider({
        input: 'input',
        response: 'response',
        conversation_id: '',
        interaction_id: 'interaction_id',
        create_time: '',
        additional_info: {
          'QuestionSuggestor.output': '["Foo", "Bar"]',
        },
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
        suggestedActions: [
          {
            actionType: 'send_as_input',
            message: 'Foo',
          },
          {
            actionType: 'send_as_input',
            message: 'Bar',
          },
        ],
      },
    ]);
  });

  it('sanitizes markdown outputs', async () => {
    const outputs = await BasicInputOutputParser.parserProvider({
      input: 'test question',
      response:
        'normal text<b onmouseover=alert("XSS testing!")></b> <img src="image.jpg" alt="image" width="500" height="600"> !!!!!!![](http://evil.com/) ![image](http://evil.com/) [good link](https://link)',
      conversation_id: 'test-session',
      interaction_id: 'interaction_id',
      create_time: '',
    });

    expect(outputs).toEqual([
      {
        type: 'input',
        contentType: 'text',
        content: 'test question',
      },
      {
        content:
          'normal text<b></b>  [](http://evil.com/) [image](http://evil.com/) [good link](https://link)',
        contentType: 'markdown',
        traceId: 'interaction_id',
        type: 'output',
        suggestedActions: [],
      },
    ]);
  });
});

describe('parseSuggestedActions', () => {
  it('should return parsed array when string matches valid json format', () => {
    expect(parseSuggestedActions('["1", "2"]')).toEqual(['1', '2']);
  });

  it('should return parsed array when there is json inside the string', () => {
    expect(parseSuggestedActions('Here are result { "response": ["1", "2"] }')).toEqual(['1', '2']);
  });

  it('should return parsed array when there is {} inside the string', () => {
    expect(parseSuggestedActions('Here are result { "response": ["{1}", "{2}"] }')).toEqual([
      '{1}',
      '{2}',
    ]);
  });

  it('should return parsed array when there is additional field in response', () => {
    expect(
      parseSuggestedActions('Here are result { "response": ["{1}", "{2}"], "foo": "bar" }')
    ).toEqual(['{1}', '{2}']);
  });

  it('should return empty array when there the json is invalid', () => {
    expect(
      parseSuggestedActions('Here are result { response": ["{1}", "{2}"], "foo": "bar" }')
    ).toEqual([]);
  });

  it('should return empty array when input is not valid', () => {
    expect(parseSuggestedActions('')).toEqual([]);
    expect(parseSuggestedActions((null as unknown) as string)).toEqual([]);
  });
});
