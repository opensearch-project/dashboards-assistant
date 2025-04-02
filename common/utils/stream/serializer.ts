/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { StreamChunk } from '../../types/chat_saved_object_attributes';

const separators = `\n\n`;
const prefix = 'data: ';

export const streamSerializer = (chunk: StreamChunk): string => {
  return `${prefix}${JSON.stringify(chunk)}${separators}`;
};

export const sreamDeserializer = (content: string): StreamChunk[] => {
  return content
    .split(separators)
    .filter((item) => item)
    .map((item) => {
      try {
        return JSON.parse(item.replace(new RegExp(`^${prefix}`), ''));
      } catch (e) {
        return {
          type: 'error',
          body: e.message,
        };
      }
    });
};
