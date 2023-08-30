/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiMarkdownFormat, EuiText, getDefaultOuiMarkdownParsingPlugins } from '@elastic/eui';
import React from 'react';
import { IMessage } from '../../../../../common/types/chat_saved_object_attributes';
import { PPLVisualization } from '../../components/ppl_visualization';
import { CoreVisualization } from '../../components/core_visualization';

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
      // TODO remove after https://github.com/opensearch-project/oui/pull/801
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsingPlugins = getDefaultOuiMarkdownParsingPlugins() as Array<[any, any]>; // Array<unified.PluginTuple<any[], unified.Settings>>
      const emojiPlugin = parsingPlugins.find(([, settings]) => settings.emoticon)?.at(1);
      if (emojiPlugin) emojiPlugin.emoticon = false;
      return (
        <EuiMarkdownFormat parsingPluginList={parsingPlugins}>
          {props.message.content}
        </EuiMarkdownFormat>
      );

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
