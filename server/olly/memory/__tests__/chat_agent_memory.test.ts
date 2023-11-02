/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createMessage } from '../../__tests__/__utils__/test_helpers';
import { memoryInit } from '../chat_agent_memory';

describe('convert messages to memory', () => {
  it('removes initial AI messages', async () => {
    const memory = memoryInit([
      createMessage({ type: 'output', content: 'ai message 1' }),
      createMessage({ type: 'output', content: 'ai message 2' }),
      createMessage({ type: 'input', content: 'human message 1' }),
      createMessage({ type: 'output', content: 'ai message 3' }),
    ]);
    const messages = await memory.chatHistory.getMessages();
    expect(messages).toMatchObject([{ content: 'human message 1' }, { content: 'ai message 3' }]);
  });

  it('returns empty history if no human input', async () => {
    const memory = memoryInit([
      createMessage({ type: 'output', content: 'ai message 1' }),
      createMessage({ type: 'output', content: 'ai message 2' }),
    ]);
    const messages = await memory.chatHistory.getMessages();
    expect(messages).toStrictEqual([]);
  });

  it('removes error outputs', async () => {
    const memory = memoryInit([
      createMessage({ type: 'input', contentType: 'text', content: 'human message 1' }),
      createMessage({ type: 'output', contentType: 'error', content: 'ai message 1' }),
    ]);
    const messages = await memory.chatHistory.getMessages();
    expect(messages).toStrictEqual([]);
  });

  it('removes unmatched input/output pairs', async () => {
    const memory = memoryInit([
      createMessage({ type: 'input', content: 'human message 1' }),
      createMessage({ type: 'input', content: 'human message 2' }),
      createMessage({ type: 'input', content: 'human message 3' }),
      createMessage({ type: 'output', contentType: 'error', content: 'ai message 1' }),
      createMessage({ type: 'input', content: 'human message 4' }),
      createMessage({ type: 'output', content: 'ai message 2' }),
      createMessage({ type: 'input', content: 'human message 5' }),
      createMessage({ type: 'input', content: 'human message 6' }),
      createMessage({ type: 'output', content: 'ai message 3' }),
    ]);
    const messages = await memory.chatHistory.getMessages();
    expect(messages).toMatchObject([
      { content: 'human message 4' },
      { content: 'ai message 2' },
      { content: 'human message 6' },
      { content: 'ai message 3' },
    ]);
  });

  it('only returns the latest 5 input/output pairs', async () => {
    const messageArr = Array.from({ length: 20 }, (_, i) =>
      createMessage({
        type: i % 2 === 0 ? 'input' : 'output',
        content: `${i % 2 === 0 ? 'human' : 'ai'} message ${Math.floor(i / 2) + 1}`,
      })
    );
    messageArr.splice(10, 0, createMessage({ type: 'output', content: 'ai message 5.5' }));
    messageArr.splice(13, 0, createMessage({ type: 'output', content: 'ai message 6.5' }));
    const memory = memoryInit(messageArr);
    const messages = await memory.chatHistory.getMessages();
    expect(messages).toMatchObject([
      { content: 'human message 6' },
      { content: 'ai message 6' },
      { content: 'ai message 6.5' },
      { content: 'human message 7' },
      { content: 'ai message 7' },
      { content: 'human message 8' },
      { content: 'ai message 8' },
      { content: 'human message 9' },
      { content: 'ai message 9' },
      { content: 'human message 10' },
      { content: 'ai message 10' },
    ]);
  });
});
