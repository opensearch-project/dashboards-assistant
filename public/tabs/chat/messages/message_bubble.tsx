/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import React from 'react';
import { i18n } from '@osd/i18n';
import { MessageActions } from './message_action';
import { useCore } from '../../../contexts';
import { getConfigSchema } from '../../../services';
import { useChatActions } from '../../../hooks';
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
  const configSchema = getConfigSchema();

  // According to the design of the feedback, only markdown type output is supported.
  const showFeedback =
    configSchema.chat.feedback &&
    'message' in props &&
    props.message.type === 'output' &&
    props.message.contentType === 'markdown';

  if ('loading' in props && props.loading) {
    return (
      <EuiPanel
        hasShadow={false}
        hasBorder={false}
        paddingSize="l"
        color="plain"
        className="llm-chat-bubble-panel llm-chat-bubble-panel-output llm-chat-bubble-panel-loading"
      >
        <EuiFlexGroup
          aria-label="chat message loading"
          gutterSize="s"
          justifyContent="flexStart"
          alignItems="center"
          responsive={false}
        >
          <EuiFlexItem grow={false}>
            <EuiLoadingSpinner size="m" />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="s">
              <i>
                {i18n.translate('chat.loading.response', {
                  defaultMessage: 'Generating response...',
                })}
              </i>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
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
              color="primary"
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
        aria-label="chat message bubble"
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
              showTraceIcon={configSchema.chat.trace && !!props.message.interactionId}
              traceTip="How was this generated?"
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
              metricAppName="chat"
            />
          </>
        )}
      </EuiPanel>
    );
  }
  return null;
});
