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
import cx from 'classnames';
import { IMessage } from '../../../../common/types/chat_saved_object_attributes';
import { useUiSetting } from '../../../../../../src/plugins/opensearch_dashboards_react/public';
import chatIcon from '../../../assets/chat.svg';

type MessageBubbleProps = {
  showActionBar: boolean;
  showRegenerate?: boolean;
  shouldActionBarVisibleOnHover?: boolean;
  onRegenerate?: () => void;
} & (
  | {
      message: IMessage;
    }
  | {
      loading: boolean;
    }
);

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo((props) => {
  const darkMode = useUiSetting<boolean>('theme:darkMode');
  if ('loading' in props && props.loading) {
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

  if ('message' in props) {
    if (props.message.type === 'input') {
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

    // if (['visualization', 'ppl_visualization'].includes(props.contentType)) {
    //   return <>{props.children}</>;
    // }

    const isVisualization = ['visualization', 'ppl_visualization'].includes(
      props.message.contentType
    );

    return (
      <EuiFlexGroup gutterSize="m" justifyContent="flexStart" alignItems="flexStart">
        <EuiFlexItem grow={false}>
          {darkMode ? (
            <EuiAvatar
              name="llm"
              size="l"
              iconType={chatIcon}
              iconSize="l"
              iconColor="#fff"
              color="#0A121A"
            />
          ) : (
            <EuiAvatar name="llm" size="l" iconType={chatIcon} iconSize="l" iconColor="#fff" />
          )}
        </EuiFlexItem>
        <EuiFlexItem className="llm-chat-bubble-wrapper">
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
                className={cx({
                  'llm-chat-action-buttons-hidden': props.shouldActionBarVisibleOnHover,
                })}
                responsive={false}
                gutterSize="s"
                alignItems="center"
                justifyContent="flexStart"
                style={{ paddingLeft: 10 }}
              >
                {!isVisualization && (
                  <EuiFlexItem grow={false}>
                    <EuiCopy textToCopy={props.message.content ?? ''}>
                      {(copy) => (
                        <EuiButtonIcon
                          aria-label="copy"
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
                    <EuiButtonIcon
                      aria-label="regenerate"
                      onClick={props.onRegenerate}
                      title="regenerate message"
                      color="text"
                      iconType="refresh"
                    />
                  </EuiFlexItem>
                )}
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon aria-label="thumbsUp" color="text" iconType="thumbsUp" />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon aria-label="thumbsDown" color="text" iconType="thumbsDown" />
                </EuiFlexItem>
              </EuiFlexGroup>
            </>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
  return null;
});
