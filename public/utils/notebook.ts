/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { v4 as uuid } from 'uuid';
import { htmlIdGenerator } from '@elastic/eui';
import { IMessage } from '../../common/types/chat_saved_object_attributes';

const buildBasicGraph = () => ({
  id: 'paragraph_' + uuid(),
  dateCreated: new Date().toISOString(),
  dateModified: new Date().toISOString(),
  input: {
    inputText: '',
    inputType: '',
  },
  output: [{ result: '', outputType: '', execution_time: '0 ms' }],
});

const ASSISTANT_MESSAGE_PREFIX = 'OpenSearch Assistant: ';

const createDashboardVizObject = (objectId: string) => {
  const vizUniqueId = htmlIdGenerator()();
  // a dashboard container object for new visualization
  const basicVizObject = {
    viewMode: 'view',
    panels: {
      '1': {
        gridData: {
          x: 0,
          y: 0,
          w: 50,
          h: 20,
          i: '1',
        },
        type: 'visualization',
        explicitInput: {
          id: '1',
          savedObjectId: objectId,
        },
      },
    },
    isFullScreenMode: false,
    filters: [],
    useMargins: false,
    id: vizUniqueId,
    timeRange: {
      // We support last 15minutes here to keep consistent with chat bot preview.
      to: 'now',
      from: 'now-15m',
    },
    title: 'embed_viz_' + vizUniqueId,
    query: {
      query: '',
      language: 'lucene',
    },
    refreshConfig: {
      pause: true,
      value: 15,
    },
  } as const;
  return basicVizObject;
};

export const convertMessagesToParagraphs = (messages: IMessage[], username: string) => {
  const userMessagePrefix = `${username}: `;

  return messages.map((message: IMessage) => {
    const paragraph = buildBasicGraph();

    switch (message.contentType) {
      // markdown,text and error are all text formatted in notebook.
      case 'markdown':
      case 'text':
      case 'error':
        const messageText =
          // markdown and error represents assistant, text represents user.
          message.contentType === 'text'
            ? userMessagePrefix + message.content
            : ASSISTANT_MESSAGE_PREFIX + message.content;

        Object.assign(paragraph, {
          input: { inputText: `%md\n${messageText}`, inputType: 'MARKDOWN' },
          output: [
            {
              result: messageText,
              outputType: 'MARKDOWN',
              execution_time: '0 ms',
            },
          ],
        });
        break;

      case 'ppl_data_grid':
        const queryText = message.content;
        Object.assign(paragraph, {
          input: { inputText: `%ppl\n${queryText}`, inputType: 'MARKDOWN' },
          output: [
            {
              result: `\n${queryText}`,
              outputType: 'QUERY',
              execution_time: '0 ms',
            },
          ],
        });
        break;

      case 'visualization':
        const visualizationObjectId = message.content;
        const inputText = JSON.stringify(createDashboardVizObject(visualizationObjectId));
        Object.assign(paragraph, {
          input: { inputText, inputType: 'VISUALIZATION' },
          output: [
            {
              result: '',
              outputType: 'VISUALIZATION',
              execution_time: '0 ms',
            },
          ],
        });
        break;

      // error and ppl_visualization contentType will not be handled currently.
      default:
        break;
    }
    return paragraph;
  });
};

export type Paragraphs = ReturnType<typeof convertMessagesToParagraphs>;
