/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageContent } from './message_content';
import * as chatContextExports from '../../../contexts/chat_context';

jest.mock('../../../components/core_visualization', () => {
  return {
    CoreVisualization: () => <div aria-label="visualization" />,
  };
});

describe('<MessageContent />', () => {
  const pplVisualizationRenderMock = jest.fn();
  const customizedRenderMock = jest.fn();

  beforeEach(() => {
    jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue({
      contentRenderers: {
        ppl_visualization: pplVisualizationRenderMock,
        customized_content_type: customizedRenderMock,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should display message(text)', () => {
    render(
      <MessageContent
        message={{ type: 'input', contentType: 'text', content: 'what indices are in my cluster?' }}
      />
    );
    expect(screen.queryAllByText('what indices are in my cluster?')).toHaveLength(1);
  });

  it('should display message(error)', () => {
    render(
      <MessageContent
        message={{
          type: 'output',
          contentType: 'error',
          content: 'what indices are in my cluster?',
        }}
      />
    );
    expect(screen.queryAllByText('what indices are in my cluster?')).toHaveLength(1);
  });

  it('should display message(visualization)', () => {
    render(
      <MessageContent
        message={{
          type: 'output',
          contentType: 'visualization',
          content: 'vis_id_mock',
        }}
      />
    );
    expect(screen.queryAllByLabelText('visualization')).toHaveLength(1);
  });

  it('should display message(markdown)', () => {
    render(
      <MessageContent
        message={{
          type: 'output',
          contentType: 'markdown',
          content: '# title',
        }}
      />
    );
    expect(screen.queryAllByText('title')).toHaveLength(1);
  });

  it('should render ppl visualization', () => {
    render(
      <MessageContent
        message={{
          type: 'output',
          contentType: 'ppl_visualization',
          content: 'mock ppl query',
          isVisualization: true,
        }}
      />
    );
    expect(pplVisualizationRenderMock.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "content": "mock ppl query",
          "contentType": "ppl_visualization",
          "isVisualization": true,
          "type": "output",
        },
        Object {
          "chatContext": Object {
            "contentRenderers": Object {
              "ppl_visualization": [MockFunction] {
                "calls": Array [
                  [Circular],
                ],
                "results": Array [
                  Object {
                    "type": "return",
                    "value": undefined,
                  },
                ],
              },
            },
          },
          "props": Object {
            "message": Object {
              "content": "mock ppl query",
              "contentType": "ppl_visualization",
              "isVisualization": true,
              "type": "output",
            },
          },
        },
      ]
    `);
  });

  it('should render customized render content', () => {
    render(
      <MessageContent
        message={{
          type: 'output',
          contentType: 'customized_content_type',
          content: 'mock customized content',
        }}
      />
    );
    expect(customizedRenderMock).toHaveBeenCalledWith('mock customized content');
  });
});
