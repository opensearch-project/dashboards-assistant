/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { StreamChunk } from '../../types/chat_saved_object_attributes';

const separators = `\n`;

export const streamSerializer = (chunk: StreamChunk): string => {
  return `${JSON.stringify(chunk)}${separators}`;
};

export const sreamDeserializer = (content: string): StreamChunk[] => {
  return content
    .split(separators)
    .filter((item) => item)
    .map((item) => JSON.parse(item));
};
