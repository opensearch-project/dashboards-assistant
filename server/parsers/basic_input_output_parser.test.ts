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
        conversationId: '',
        interactionId: 'interaction_id',
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
        interactionId: 'interaction_id',
      },
    ]);
  });

  it('sanitizes markdown outputs', async () => {
    const outputs = await BasicInputOutputParser.parserProvider({
      input: 'test question',
      response:
        'normal text<b onmouseover=alert("XSS testing!")></b> <img src="image.jpg" alt="image" width="500" height="600"> !!!!!!![](http://evil.com/) ![image](http://evil.com/) [good link](https://link)',
      conversationId: 'test-conversation',
      interactionId: 'interaction_id',
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
        interactionId: 'interaction_id',
        type: 'output',
      },
    ]);
  });
});
