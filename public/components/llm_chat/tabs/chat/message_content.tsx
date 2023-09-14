/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiMarkdownFormat, EuiText } from '@elastic/eui';
import React from 'react';
import { IMessage } from '../../../../../common/types/chat_saved_object_attributes';
import { CoreVisualization } from '../../components/core_visualization';
import { PPLVisualization } from '../../components/ppl_visualization';

interface MessageContentProps {
  message: IMessage;
}

export const MessageContent: React.FC<MessageContentProps> = React.memo((props) => {
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

    case 'ppl_visualization':
      return (
        <div className="llm-chat-visualizations">
          <PPLVisualization query={props.message.content} />
        </div>
      );

    default:
      return null;
  }
});
