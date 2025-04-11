/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createParser } from 'eventsource-parser';
import { StreamChunk } from '../../types/chat_saved_object_attributes';

const separators = `\n\n`;
const prefix = 'data: ';

export const streamSerializer = (chunk: StreamChunk): string => {
  const { event, data } = chunk;
  let chunkString = '';
  if (event) {
    chunkString += `event: ${event}\n`;
  }

  chunkString += `${prefix}${JSON.stringify(data)}${separators}`;

  return chunkString;
};

export const streamDeserializer = (content: string): StreamChunk[] => {
  const streamChunks: StreamChunk[] = [];
  const parser = createParser({
    onEvent(message) {
      try {
        const dataPayload = JSON.parse(message.data);
        streamChunks.push({
          ...message,
          data: dataPayload,
        } as StreamChunk);
      } catch (e) {
        streamChunks.push({
          event: 'error',
          data: e.message,
        });
      }
    },
    onError(error) {
      streamChunks.push({
        event: 'error',
        data: error.message,
      });
    },
  });
  parser.feed(content);
  return streamChunks;
};
