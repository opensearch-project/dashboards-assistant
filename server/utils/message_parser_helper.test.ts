/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MessageParserHelper } from './message_parser_helper';

describe('MessageParserHelper', () => {
  it('return with correct message', async () => {
    const messageParserHelper = new MessageParserHelper();
    messageParserHelper.addMessage({
      type: 'output',
      contentType: 'markdown',
      content: 'output',
    });
    expect(messageParserHelper.messages).toEqual([
      {
        type: 'output',
        contentType: 'markdown',
        content: 'output',
      },
    ]);
  });
});
