/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiMarkdownFormat, EuiText } from '@elastic/eui';
import React, { useContext } from 'react';
import { IMessage } from '../../../../../common/types/chat_saved_object_attributes';
import { ChatContext } from '../../chat_header_button';
import { CoreVisualization } from '../../components/core_visualization';

interface MessageContentProps {
  message: IMessage;
}

export const MessageContent: React.FC<MessageContentProps> = React.memo((props) => {
  const chatContext = useContext(ChatContext)!;

  switch (props.message.contentType) {
    case 'text':
      return <EuiText style={{ whiteSpace: 'pre-line' }}>{props.message.content}</EuiText>;

    case 'error':
      return (
        <EuiText color="danger" style={{ whiteSpace: 'pre-line' }}>
          {props.message.content}
        </EuiText>
      );

    case 'markdown':
      return <EuiMarkdownFormat>{props.message.content}</EuiMarkdownFormat>;

    case 'visualization':
      return (
        <div className="llm-chat-visualizations">
          <CoreVisualization message={props.message} />
        </div>
      );

    case 'ppl_visualization': {
      const render = chatContext.contentRenderers[props.message.contentType];
      if (!render) return null;
      return (
        <div className="llm-chat-visualizations">{render({ query: props.message.content })}</div>
      );
    }

    // content types registered by plugins unknown to assistant
    default: {
      const message = props.message as IMessage;
      return chatContext.contentRenderers[message.contentType]?.(message.content) ?? null;
    }
  }
});
