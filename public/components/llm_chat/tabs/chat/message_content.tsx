/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiHorizontalRule,
  EuiIcon,
  EuiLink,
  EuiMarkdownFormat,
  EuiText,
  getDefaultOuiMarkdownParsingPlugins,
  EuiFlyoutBody,
} from '@elastic/eui';
import moment from 'moment';
import React, { useContext, useEffect, useState } from 'react';
import { DashboardContainerInput } from '../../../../../../../src/plugins/dashboard/public';
import { IMessage } from '../../../../../common/types/observability_saved_object_attributes';
import { uiSettingsService } from '../../../../../common/utils';
import { ChatContext, CoreServicesContext } from '../../chat_header_button';
import { LangchainTraces } from '../../components/langchain_traces';
import { PPLVisualization } from '../../components/ppl_visualization';

interface MessageContentProps {
  message: IMessage;
}

export const MessageContent: React.FC<MessageContentProps> = React.memo((props) => {
  const coreServicesContext = useContext(CoreServicesContext)!;
  const chatContext = useContext(ChatContext)!;
  const [visInput, setVisInput] = useState<DashboardContainerInput>();

  useEffect(() => {
    if (props.message.contentType === 'visualization') {
      setVisInput(JSON.parse(props.message.content));
    }
  }, [props.message]);

  let content: React.ReactNode;

  switch (props.message.contentType) {
    case 'text':
      content = <EuiText style={{ whiteSpace: 'pre-line' }}>{props.message.content}</EuiText>;
      break;

    case 'markdown':
      // TODO remove after https://github.com/opensearch-project/oui/pull/801
      const parsingPlugins = getDefaultOuiMarkdownParsingPlugins() as Array<[any, any]>; // Array<unified.PluginTuple<any[], unified.Settings>>
      const emojiPlugin = parsingPlugins.find(([, settings]) => settings.emoticon)?.at(1);
      if (emojiPlugin) emojiPlugin.emoticon = false;
      content = (
        <EuiMarkdownFormat parsingPluginList={parsingPlugins}>
          {props.message.content}
        </EuiMarkdownFormat>
      );
      break;

    case 'visualization':
      const dateFormat = uiSettingsService.get('dateFormat');
      let from = moment(visInput?.timeRange?.from).format(dateFormat);
      let to = moment(visInput?.timeRange?.to).format(dateFormat);
      from = from === 'Invalid date' ? visInput?.timeRange.from : from;
      to = to === 'Invalid date' ? visInput?.timeRange.to : to;
      content = (
        <>
          <EuiText size="s">{`${from} - ${to}`}</EuiText>
          <div className="llm-chat-visualizations">
            <coreServicesContext.DashboardContainerByValueRenderer
              input={JSON.parse(props.message.content)}
              onInputUpdated={setVisInput}
            />
          </div>
        </>
      );
      break;

    case 'ppl_visualization':
      content = (
        <div className="llm-chat-visualizations">
          <PPLVisualization query={props.message.content} />
        </div>
      );
      break;

    default:
      return null;
  }

  return (
    <>
      {content}
      {typeof props.message.sessionId === 'string' && (
        <>
          <EuiHorizontalRule />
          <EuiLink
            onClick={() => {
              console.info('❗props.message.sessionId:', props.message.sessionId);
              chatContext.setFlyoutComponent(
                <EuiFlyoutBody>
                  <LangchainTraces sessionId={props.message.sessionId as string} />
                </EuiFlyoutBody>
              );
            }}
          >
            How was this generated? <EuiIcon type="iInCircle" />
          </EuiLink>
        </>
      )}
    </>
  );
});
