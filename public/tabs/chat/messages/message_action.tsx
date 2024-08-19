/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiSmallButtonIcon, EuiCopy } from '@elastic/eui';
import { IOutput, Interaction } from '../../../../common/types/chat_saved_object_attributes';
import { useFeedback } from '../../../hooks/use_feed_back';
import { HttpSetup } from '../../../../../../src/core/public';
import { DataSourceService } from '../../../services/data_source_service';

interface MessageActionsProps {
  contentToCopy?: string;
  showRegenerate?: boolean;
  onRegenerate?: () => void;
  interaction?: Interaction | null;
  message?: IOutput | null;
  showFeedback?: boolean;
  showTraceIcon?: boolean;
  traceInteractionId?: string;
  onViewTrace?: () => void;
  shouldActionBarVisibleOnHover?: boolean;
  isFullWidth?: boolean;
  httpSetup?: HttpSetup;
  dataSourceService?: DataSourceService;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  contentToCopy = '',
  showRegenerate = false,
  onRegenerate,
  interaction,
  message,
  showFeedback = false,
  showTraceIcon = false,
  traceInteractionId = null,
  onViewTrace = null,
  shouldActionBarVisibleOnHover = false,
  isFullWidth = false,
  httpSetup,
  dataSourceService,
}) => {
  const { feedbackResult, sendFeedback } = useFeedback(interaction, httpSetup, dataSourceService);

  const handleFeedback = useCallback(
    (correct: boolean) => {
      if (feedbackResult !== undefined || !message) {
        return;
      }
      sendFeedback(message, correct);
    },
    [feedbackResult, message, sendFeedback]
  );

  return (
    <EuiFlexGroup
      aria-label="message actions"
      className={shouldActionBarVisibleOnHover ? 'llm-chat-action-buttons-hidden' : ''}
      responsive={false}
      gutterSize="s"
      alignItems="center"
      justifyContent="flexStart"
      style={{ paddingLeft: 10 }}
    >
      {!isFullWidth && (
        <EuiFlexItem grow={false}>
          <EuiCopy textToCopy={contentToCopy}>
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
      {showRegenerate && onRegenerate && (
        <EuiFlexItem grow={false}>
          <EuiSmallButtonIcon
            aria-label="regenerate message"
            onClick={onRegenerate}
            title="regenerate message"
            color="text"
            iconType="refresh"
          />
        </EuiFlexItem>
      )}
      {showFeedback && (
        <>
          {feedbackResult !== false && (
            <EuiFlexItem grow={false}>
              <EuiSmallButtonIcon
                aria-label="feedback thumbs up"
                color={feedbackResult === true ? 'primary' : 'text'}
                iconType="thumbsUp"
                onClick={() => handleFeedback(true)}
              />
            </EuiFlexItem>
          )}
          {feedbackResult !== true && (
            <EuiFlexItem grow={false}>
              <EuiSmallButtonIcon
                aria-label="feedback thumbs down"
                color={feedbackResult === false ? 'primary' : 'text'}
                iconType="thumbsDown"
                onClick={() => handleFeedback(false)}
              />
            </EuiFlexItem>
          )}
        </>
      )}
      {showTraceIcon && traceInteractionId && onViewTrace && (
        <EuiFlexItem grow={false}>
          <EuiSmallButtonIcon
            aria-label="How was this generated?"
            data-test-subj={`trace-icon-${traceInteractionId}`}
            onClick={onViewTrace}
            title="How was this generated?"
            color="text"
            iconType="iInCircle"
          />
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};
