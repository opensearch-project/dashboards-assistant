/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiAvatar,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingContent,
  EuiLoadingSpinner,
  EuiPanel,
  EuiSpacer,
  EuiIcon,
} from '@elastic/eui';
import React from 'react';
import { IconType } from '@elastic/eui/src/components/icon/icon';
import { MessageActions } from './message_action';
import { useCore } from '../../../contexts';

// TODO: Replace with getChrome().logos.Chat.url
import { useChatActions } from '../../../hooks';
import chatIcon from '../../../assets/chat.svg';
import {
  IMessage,
  IOutput,
  ISuggestedAction,
  Interaction,
} from '../../../../common/types/chat_saved_object_attributes';

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
  const { executeAction } = useChatActions();
  const core = useCore();
  // According to the design of the feedback, only markdown type output is supported.
  const showFeedback =
    'message' in props &&
    props.message.type === 'output' &&
    props.message.contentType === 'markdown';

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
            {props.showActionBar && (
              <>
                <EuiSpacer size="xs" />
                <MessageActions
                  contentToCopy={props.message.content ?? ''}
                  showRegenerate={props.showRegenerate}
                  onRegenerate={() => props.onRegenerate?.(props.interaction?.interaction_id || '')}
                  interaction={props.interaction}
                  message={props.message as IOutput}
                  showFeedback={showFeedback}
                  showTraceIcon={!!props.message.interactionId}
                  traceInteractionId={props.message.interactionId || ''}
                  onViewTrace={() => {
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
                  shouldActionBarVisibleOnHover={props.shouldActionBarVisibleOnHover}
                  isFullWidth={fullWidth}
                  httpSetup={core.services.http}
                  dataSourceService={core.services.dataSource}
                  usageCollection={core.services.setupDeps.usageCollection}
                />
              </>
            )}
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
  return null;
});
