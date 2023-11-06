/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiAvatar,
  EuiButtonIcon,
  EuiCopy,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingContent,
  EuiLoadingSpinner,
  EuiPanel,
  EuiSpacer,
} from '@elastic/eui';
import React from 'react';
import { IMessage } from '../../../../common/types/chat_saved_object_attributes';
import { useUiSetting } from '../../../../../../src/plugins/opensearch_dashboards_react/public';

type MessageBubbleProps = (
  | { showActionBar: false }
  | { showActionBar: true; showRegenerate: boolean }
) &
  (
    | {
        type: IMessage['type'];
        contentType: IMessage['contentType'];
        content?: IMessage['content'];
      }
    | {
        type: 'loading';
      }
  );

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo((props) => {
  const darkMode = useUiSetting<boolean>('theme:darkMode');
  if (props.type === 'input') {
    return (
      <EuiFlexGroup gutterSize="m" justifyContent="flexEnd" alignItems="flexStart">
        <EuiFlexItem>
          <EuiPanel
            hasShadow={false}
            hasBorder={false}
            paddingSize="l"
            color="plain"
            className="llm-chat-bubble-panel llm-chat-bubble-panel-input"
          >
            {props.children}
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  if (props.type === 'loading') {
    return (
      <EuiFlexGroup gutterSize="m" justifyContent="flexStart" alignItems="flexStart">
        <EuiFlexItem grow={false}>
          {darkMode ? (
            <EuiAvatar
              name="llm"
              size="l"
              iconType={EuiLoadingSpinner}
              iconSize="m"
              iconColor="#fff"
              color="#0A121A"
            />
          ) : (
            <EuiAvatar
              name="llm"
              size="l"
              iconType={EuiLoadingSpinner}
              iconSize="m"
              iconColor="#fff"
            />
          )}
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiPanel
            hasShadow={false}
            hasBorder={false}
            paddingSize="l"
            color="plain"
            className="llm-chat-bubble-panel llm-chat-bubble-panel-output llm-chat-bubble-panel-loading"
          >
            <EuiLoadingContent lines={3} />
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  // if (['visualization', 'ppl_visualization'].includes(props.contentType)) {
  //   return <>{props.children}</>;
  // }

  const isVisualization = ['visualization', 'ppl_visualization'].includes(props.contentType);

  return (
    <EuiFlexGroup gutterSize="m" justifyContent="flexStart" alignItems="flexStart">
      <EuiFlexItem grow={false}>
        {darkMode ? (
          <EuiAvatar
            name="llm"
            size="l"
            iconType="chatRight"
            iconSize="m"
            iconColor="#fff"
            color="#0A121A"
          />
        ) : (
          <EuiAvatar name="llm" size="l" iconType="chatRight" iconSize="m" iconColor="#fff" />
        )}
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiPanel
          style={isVisualization ? { minWidth: '100%' } : {}}
          hasShadow={false}
          hasBorder={false}
          paddingSize="l"
          color="plain"
          className="llm-chat-bubble-panel llm-chat-bubble-panel-output"
        >
          {props.children}
        </EuiPanel>
        {props.showActionBar && (
          <>
            <EuiSpacer size="xs" />
            <EuiFlexGroup
              responsive={false}
              gutterSize="s"
              alignItems="center"
              justifyContent="flexStart"
              style={{ paddingLeft: 10 }}
            >
              {!isVisualization && (
                <EuiFlexItem grow={false}>
                  <EuiCopy textToCopy={props.content ?? ''}>
                    {(copy) => (
                      <EuiButtonIcon
                        title="copy message"
                        onClick={copy}
                        color="text"
                        iconType="copy"
                      />
                    )}
                  </EuiCopy>
                </EuiFlexItem>
              )}
              {props.showRegenerate && (
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon title="regenerate message" color="text" iconType="refresh" />
                </EuiFlexItem>
              )}
              <EuiFlexItem grow={false}>
                <EuiButtonIcon color="text" iconType="thumbsUp" />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButtonIcon color="text" iconType="thumbsDown" />
              </EuiFlexItem>
            </EuiFlexGroup>
          </>
        )}
      </EuiFlexItem>
    </EuiFlexGroup>
  );
});
