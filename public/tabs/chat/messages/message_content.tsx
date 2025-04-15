/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiText } from '@elastic/eui';
import React from 'react';
import { IMessage } from '../../../../common/types/chat_saved_object_attributes';
import { CoreVisualization } from '../../../components/core_visualization';
import { useChatContext } from '../../../contexts/chat_context';
import { BlinkCursor } from '../../../components/blink_cursor';
import { MarkdownWithBlinkCursor } from '../../../components/markdown_with_blink_cursor';

export interface MessageContentProps {
  message: IMessage;
  loading?: boolean;
}

export const MessageContent: React.FC<MessageContentProps> = React.memo((props) => {
  const chatContext = useChatContext();

  switch (props.message.contentType) {
    case 'text':
      return (
        <EuiText style={{ whiteSpace: 'pre-line' }}>
          {props.message.content}
          {props.loading ? <BlinkCursor /> : null}
        </EuiText>
      );

    case 'error':
      return (
        <EuiText color="danger" style={{ whiteSpace: 'pre-line' }}>
          {props.message.content}
        </EuiText>
      );

    case 'markdown':
      return (
        <MarkdownWithBlinkCursor loading={props.loading}>
          {props.message.content}
        </MarkdownWithBlinkCursor>
      );

    case 'visualization':
      return (
        <div className="llm-chat-visualizations">
          <CoreVisualization message={props.message} />
        </div>
      );

    // content types registered by plugins unknown to assistant
    default: {
      const message = props.message as IMessage;
      return (
        chatContext.messageRenderers[message.contentType]?.(message, {
          props,
          chatContext,
        }) ?? null
      );
    }
  }
});
