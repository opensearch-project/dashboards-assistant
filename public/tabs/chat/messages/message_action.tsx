/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiButtonIcon, EuiCopy } from '@elastic/eui';

interface MessageActionsProps {
  contentToCopy?: string;
  showRegenerate?: boolean;
  onRegenerate?: () => void;
  feedbackResult?: boolean;
  showFeedback?: boolean;
  onFeedback?: (correct: boolean) => void;
  showTraceIcon?: boolean;
  traceInteractionId?: string;
  onViewTrace?: () => void;
  shouldActionBarVisibleOnHover?: boolean;
  isFullWidth?: boolean;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  contentToCopy = '',
  showRegenerate = false,
  onRegenerate,
  feedbackResult,
  showFeedback = false,
  onFeedback,
  showTraceIcon = false,
  traceInteractionId = null,
  onViewTrace = null,
  shouldActionBarVisibleOnHover = false,
  isFullWidth = false,
}) => {
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
              <EuiButtonIcon
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
          <EuiButtonIcon
            aria-label="regenerate message"
            onClick={onRegenerate}
            title="regenerate message"
            color="text"
            iconType="refresh"
          />
        </EuiFlexItem>
      )}
      {showFeedback && onFeedback && (
        <>
          {feedbackResult !== false && (
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                aria-label="feedback thumbs up"
                color={feedbackResult === true ? 'primary' : 'text'}
                iconType="thumbsUp"
                onClick={() => onFeedback(true)}
              />
            </EuiFlexItem>
          )}
          {feedbackResult !== true && (
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                aria-label="feedback thumbs down"
                color={feedbackResult === false ? 'primary' : 'text'}
                iconType="thumbsDown"
                onClick={() => onFeedback(false)}
              />
            </EuiFlexItem>
          )}
        </>
      )}
      {showTraceIcon && traceInteractionId && onViewTrace && (
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
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
