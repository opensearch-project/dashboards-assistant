/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as uuidExports from 'uuid';
import { convertMessagesToParagraphs } from '../notebook';

jest.mock('uuid', () => ({
  ...jest.requireActual('uuid'),
  __esModule: true,
}));

describe('notebook convertMessagesToParagraphs utils', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2023, 11, 26));
    jest.spyOn(uuidExports, 'v4').mockReturnValue('a-fixed-uuid');
  });
  afterAll(() => {
    jest.useRealTimers();
    jest.spyOn(uuidExports, 'v4').mockRestore();
  });
  it('should return consistent paragraphs if contentType is text', () => {
    expect(
      convertMessagesToParagraphs([{ type: 'input', contentType: 'text', content: 'bar' }], 'foo')
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "dateCreated": "2023-12-26T00:00:00.000Z",
          "dateModified": "2023-12-26T00:00:00.000Z",
          "id": "paragraph_a-fixed-uuid",
          "input": Object {
            "inputText": "%md
      foo: bar",
            "inputType": "MARKDOWN",
          },
          "output": Array [
            Object {
              "execution_time": "0 ms",
              "outputType": "MARKDOWN",
              "result": "foo: bar",
            },
          ],
        },
      ]
    `);
  });

  it('should return consistent paragraphs if contentType is markdown', () => {
    expect(
      convertMessagesToParagraphs(
        [{ type: 'output', contentType: 'markdown', content: 'bar' }],
        'foo'
      )
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "dateCreated": "2023-12-26T00:00:00.000Z",
          "dateModified": "2023-12-26T00:00:00.000Z",
          "id": "paragraph_a-fixed-uuid",
          "input": Object {
            "inputText": "%md
      OpenSearch Assistant: bar",
            "inputType": "MARKDOWN",
          },
          "output": Array [
            Object {
              "execution_time": "0 ms",
              "outputType": "MARKDOWN",
              "result": "OpenSearch Assistant: bar",
            },
          ],
        },
      ]
    `);
  });

  it('should return consistent paragraphs if contentType is error', () => {
    expect(
      convertMessagesToParagraphs([{ type: 'output', contentType: 'error', content: 'bar' }], 'foo')
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "dateCreated": "2023-12-26T00:00:00.000Z",
          "dateModified": "2023-12-26T00:00:00.000Z",
          "id": "paragraph_a-fixed-uuid",
          "input": Object {
            "inputText": "%md
      OpenSearch Assistant: bar",
            "inputType": "MARKDOWN",
          },
          "output": Array [
            Object {
              "execution_time": "0 ms",
              "outputType": "MARKDOWN",
              "result": "OpenSearch Assistant: bar",
            },
          ],
        },
      ]
    `);
  });

  it('should return consistent paragraphs if contentType is visualization', () => {
    expect(
      convertMessagesToParagraphs(
        [{ type: 'output', contentType: 'visualization', content: 'bar' }],
        'foo'
      )
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "dateCreated": "2023-12-26T00:00:00.000Z",
          "dateModified": "2023-12-26T00:00:00.000Z",
          "id": "paragraph_a-fixed-uuid",
          "input": Object {
            "inputText": "{\\"viewMode\\":\\"view\\",\\"panels\\":{\\"1\\":{\\"gridData\\":{\\"x\\":0,\\"y\\":0,\\"w\\":50,\\"h\\":20,\\"i\\":\\"1\\"},\\"type\\":\\"visualization\\",\\"explicitInput\\":{\\"id\\":\\"1\\",\\"savedObjectId\\":\\"bar\\"}}},\\"isFullScreenMode\\":false,\\"filters\\":[],\\"useMargins\\":false,\\"id\\":\\"random_html_id\\",\\"timeRange\\":{\\"to\\":\\"now\\",\\"from\\":\\"now-15m\\"},\\"title\\":\\"embed_viz_random_html_id\\",\\"query\\":{\\"query\\":\\"\\",\\"language\\":\\"lucene\\"},\\"refreshConfig\\":{\\"pause\\":true,\\"value\\":15}}",
            "inputType": "VISUALIZATION",
          },
          "output": Array [
            Object {
              "execution_time": "0 ms",
              "outputType": "VISUALIZATION",
              "result": "",
            },
          ],
        },
      ]
    `);
  });

  it('should return consistent paragraphs if contentType is not supported', () => {
    expect(
      convertMessagesToParagraphs(
        [{ type: 'output', contentType: 'not-supported', content: 'bar' }],
        'foo'
      )
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "dateCreated": "2023-12-26T00:00:00.000Z",
          "dateModified": "2023-12-26T00:00:00.000Z",
          "id": "paragraph_a-fixed-uuid",
          "input": Object {
            "inputText": "",
            "inputType": "",
          },
          "output": Array [
            Object {
              "execution_time": "0 ms",
              "outputType": "",
              "result": "",
            },
          ],
        },
      ]
    `);
  });
});
