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
  EuiIcon,
} from '@elastic/eui';
import React, { useCallback } from 'react';
import { IconType } from '@elastic/eui/src/components/icon/icon';
import cx from 'classnames';
import chatIcon from '../../../assets/chat.svg';
import {
  IMessage,
  IOutput,
  Interaction,
} from '../../../../common/types/chat_saved_object_attributes';
import { useFeedback } from '../../../hooks/use_feed_back';

type MessageBubbleProps = {
  showActionBar: boolean;
  showRegenerate?: boolean;
  shouldActionBarVisibleOnHover?: boolean;
  onRegenerate?: () => void;
} & (
  | {
      message: IMessage;
      interaction?: Interaction;
    }
  | {
      loading: boolean;
    }
);

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo((props) => {
  const { feedbackResult, sendFeedback } = useFeedback(
    'interaction' in props ? props.interaction : null
  );

  // According to the design of the feedback, only markdown type output is supported.
  const showFeedback =
    'message' in props &&
    props.message.type === 'output' &&
    props.message.contentType === 'markdown';

  const feedbackOutput = useCallback(
    (correct: boolean, result: boolean | undefined) => {
      // No repeated feedback.
      if (result !== undefined || !('message' in props)) {
        return;
      }
      sendFeedback(props.message as IOutput, correct);
    },
    [props, sendFeedback]
  );

  const createAvatar = (iconType?: IconType) => {
    if (iconType) {
      return (
        <EuiAvatar
          className="llm-chat-avatar"
          name="llm"
          size="l"
          iconType={iconType}
          iconColor="#fff"
        />
      );
    } else {
      return <EuiIcon type={chatIcon} size="l" />;
    }
  };

  if ('loading' in props && props.loading) {
    return (
      <EuiFlexGroup
        gutterSize="m"
        justifyContent="flexStart"
        alignItems="flexStart"
        responsive={false}
      >
        <EuiFlexItem grow={false}>
          {createAvatar(() => (
            <EuiLoadingSpinner size="l" />
          ))}
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
        <EuiFlexGroup
          gutterSize="m"
          justifyContent="flexEnd"
          alignItems="flexStart"
          responsive={false}
        >
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
      <EuiFlexGroup
        gutterSize="m"
        justifyContent="flexStart"
        alignItems="flexStart"
        responsive={false}
      >
        <EuiFlexItem grow={false}>
          {props.message.contentType === 'error' ? createAvatar('alert') : createAvatar()}
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
                {showFeedback && (
                  // After feedback, only corresponding thumb icon will be kept and disabled.
                  <>
                    {feedbackResult !== false ? (
                      <EuiFlexItem grow={false}>
                        <EuiButtonIcon
                          aria-label="feedback"
                          color={feedbackResult === true ? 'primary' : 'text'}
                          iconType="thumbsUp"
                          onClick={() => feedbackOutput(true, feedbackResult)}
                        />
                      </EuiFlexItem>
                    ) : null}
                    {feedbackResult !== true ? (
                      <EuiFlexItem grow={false}>
                        <EuiButtonIcon
                          aria-label="feedback result"
                          color={feedbackResult === false ? 'primary' : 'text'}
                          iconType="thumbsDown"
                          onClick={() => feedbackOutput(false, feedbackResult)}
                        />
                      </EuiFlexItem>
                    ) : null}
                  </>
                )}
              </EuiFlexGroup>
            </>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
  return null;
});
