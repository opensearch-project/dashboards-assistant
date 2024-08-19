/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiAvatar,
  EuiSmallButtonIcon,
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
// TODO: Replace with getChrome().logos.Chat.url
import { useChatActions } from '../../../hooks';
import chatIcon from '../../../assets/chat.svg';
import {
  IMessage,
  IOutput,
  ISuggestedAction,
  Interaction,
} from '../../../../common/types/chat_saved_object_attributes';
import { useFeedback } from '../../../hooks/use_feed_back';

type MessageBubbleProps = {
  showActionBar: boolean;
  showRegenerate?: boolean;
  shouldActionBarVisibleOnHover?: boolean;
  onRegenerate?: (interactionId: string) => void;
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

  const { executeAction } = useChatActions();

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
        aria-label="chat message loading"
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
          aria-label="chat message bubble"
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

    const fullWidth = props.message.fullWidth;

    return (
      <EuiFlexGroup
        aria-label="chat message bubble"
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
            /**
             * When using minWidth the content width inside may be larger than the container itself,
             * especially in data grid case that the content will change its size according to fullScreen or not.
             */
            style={fullWidth ? { width: '100%' } : {}}
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
                aria-label="message actions"
                className={cx({
                  'llm-chat-action-buttons-hidden': props.shouldActionBarVisibleOnHover,
                })}
                responsive={false}
                gutterSize="s"
                alignItems="center"
                justifyContent="flexStart"
                style={{ paddingLeft: 10 }}
              >
                {!fullWidth && (
                  <EuiFlexItem grow={false}>
                    <EuiCopy textToCopy={props.message.content ?? ''}>
                      {(copy) => (
                        <EuiSmallButtonIcon
                          aria-label="copy message"
                          title="copy message"
                          onClick={copy}
                          color="text"
                          iconType="copy"
                        />
                      )}
                    </EuiCopy>
                  </EuiFlexItem>
                )}
                {props.showRegenerate && props.interaction?.interaction_id ? (
                  <EuiFlexItem grow={false}>
                    <EuiSmallButtonIcon
                      aria-label="regenerate message"
                      onClick={() => props.onRegenerate?.(props.interaction?.interaction_id || '')}
                      title="regenerate message"
                      color="text"
                      iconType="refresh"
                    />
                  </EuiFlexItem>
                ) : null}
                {showFeedback && (
                  // After feedback, only corresponding thumb icon will be kept and disabled.
                  <>
                    {feedbackResult !== false ? (
                      <EuiFlexItem grow={false}>
                        <EuiSmallButtonIcon
                          aria-label="feedback thumbs up"
                          color={feedbackResult === true ? 'primary' : 'text'}
                          iconType="thumbsUp"
                          onClick={() => feedbackOutput(true, feedbackResult)}
                        />
                      </EuiFlexItem>
                    ) : null}
                    {feedbackResult !== true ? (
                      <EuiFlexItem grow={false}>
                        <EuiSmallButtonIcon
                          aria-label="feedback thumbs down"
                          color={feedbackResult === false ? 'primary' : 'text'}
                          iconType="thumbsDown"
                          onClick={() => feedbackOutput(false, feedbackResult)}
                        />
                      </EuiFlexItem>
                    ) : null}
                  </>
                )}
                {props.message.interactionId ? (
                  <EuiFlexItem grow={false}>
                    <EuiSmallButtonIcon
                      aria-label="How was this generated?"
                      data-test-subj={`trace-icon-${props.message.interactionId}`}
                      onClick={() => {
                        const message = props.message as IOutput;

                        const viewTraceAction: ISuggestedAction = {
                          actionType: 'view_trace',
                          metadata: {
                            interactionId: message.interactionId || '',
                          },
                          message: 'How was this generated?',
                        };
                        executeAction(viewTraceAction, message);
                      }}
                      title="How was this generated?"
                      color="text"
                      iconType="iInCircle"
                    />
                  </EuiFlexItem>
                ) : null}
              </EuiFlexGroup>
            </>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
  return null;
});
