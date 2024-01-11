/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MessageContent } from './message_content';
import * as chatContextExports from '../../../contexts/chat_context';

jest.mock('../../../components/core_visualization', () => {
  return {
    CoreVisualization: () => <div aria-label="visualization" />,
  };
});

describe('<MessageContent />', () => {
  const customizedRenderMock = jest.fn();

  beforeEach(() => {
    jest.spyOn(chatContextExports, 'useChatContext').mockReturnValue({
      messageRenderers: {
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
    expect(customizedRenderMock.mock.calls[0][0]).toMatchInlineSnapshot(`
      Object {
        "content": "mock customized content",
        "contentType": "customized_content_type",
        "type": "output",
      }
    `);
    expect(customizedRenderMock.mock.calls[0][1].props).toMatchInlineSnapshot(`
      Object {
        "message": Object {
          "content": "mock customized content",
          "contentType": "customized_content_type",
          "type": "output",
        },
      }
    `);
    expect(customizedRenderMock.mock.calls[0][1].chatContext).not.toBeUndefined();
  });
});
