/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiMarkdownFormat, EuiText, getDefaultOuiMarkdownParsingPlugins } from '@elastic/eui';
import moment from 'moment';
import React, { useContext, useEffect, useState } from 'react';
import { DashboardContainerInput } from '../../../../../../../src/plugins/dashboard/public';
import { IMessage } from '../../../../../common/types/observability_saved_object_attributes';
import { uiSettingsService } from '../../../../../common/utils';
import { CoreServicesContext } from '../../chat_header_button';
import { PPLVisualization } from '../../components/ppl_visualization';

interface MessageContentProps {
  message: IMessage;
}

export const MessageContent: React.FC<MessageContentProps> = React.memo((props) => {
  const coreServicesContext = useContext(CoreServicesContext)!;
  const [visInput, setVisInput] = useState<DashboardContainerInput>();

  useEffect(() => {
    if (props.message.contentType === 'visualization') {
      setVisInput(JSON.parse(props.message.content));
    }
  }, [props.message]);

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
      const dateFormat = uiSettingsService.get('dateFormat');
      let from = moment(visInput?.timeRange?.from).format(dateFormat);
      let to = moment(visInput?.timeRange?.to).format(dateFormat);
      from = from === 'Invalid date' ? visInput?.timeRange.from : from;
      to = to === 'Invalid date' ? visInput?.timeRange.to : to;
      return (
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
