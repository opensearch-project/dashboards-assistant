/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButton, EuiFlexGroup, EuiFlexItem, EuiMarkdownFormat, EuiText } from '@elastic/eui';
import React from 'react';
import { IMessage } from '../../../../common/types/chat_saved_object_attributes';
import { CoreVisualization } from '../../../components/core_visualization';
import { useChatContext } from '../../../contexts/chat_context';
import { TAB_ID } from '../../../utils/constants';

export interface MessageContentProps {
  message: IMessage;
}

export const MessageContent: React.FC<MessageContentProps> = React.memo((props) => {
  const chatContext = useChatContext();

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
      return (
        <>
          <EuiMarkdownFormat>{props.message.content}</EuiMarkdownFormat>
          {props.message.additionalActions &&
            props.message.additionalActions.map((action, index) => (
              <div key={'action-' + index}>
                {chatContext.messageRenderers[action.actionType]?.(
                  {
                    ...{ type: 'output', contentType: action.actionType, content: action.content },
                  },
                  { props, chatContext }
                ) ?? null}
              </div>
            ))}
        </>
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
