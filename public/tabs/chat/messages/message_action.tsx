/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiSmallButtonIcon, EuiCopy, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { IOutput, Interaction } from '../../../../common/types/chat_saved_object_attributes';
import { useFeedback } from '../../../hooks/use_feed_back';
import { HttpSetup } from '../../../../../../src/core/public';
import { DataSourceService } from '../../../services/data_source_service';
import { UsageCollectionSetup } from '../../../../../../src/plugins/usage_collection/public';

interface MessageActionsProps {
  contentToCopy?: string;
  showRegenerate?: boolean;
  onRegenerate?: () => void;
  interaction?: Interaction | null;
  message?: IOutput | null;
  showFeedback?: boolean;
  showTraceIcon?: boolean;
  isOnTrace?: boolean;
  traceInteractionId?: string;
  traceTip?: string;
  onViewTrace?: () => void;
  shouldActionBarVisibleOnHover?: boolean;
  isFullWidth?: boolean;
  httpSetup?: HttpSetup;
  dataSourceService?: DataSourceService;
  usageCollection?: UsageCollectionSetup;
  metricAppName?: string;
  buttonOrder?: string[];
}

type ButtonKey = 'copy' | 'regenerate' | 'thumbUp' | 'thumbDown' | 'trace';

export const MessageActions: React.FC<MessageActionsProps> = ({
  contentToCopy = '',
  showRegenerate = false,
  onRegenerate,
  interaction,
  message = null,
  showFeedback = false,
  showTraceIcon = false,
  isOnTrace = false,
  traceInteractionId = null,
  traceTip = 'info',
  onViewTrace,
  shouldActionBarVisibleOnHover = false,
  isFullWidth = false,
  httpSetup,
  dataSourceService,
  usageCollection,
  metricAppName = 'chat',
  buttonOrder = ['trace', 'regenerate', 'thumbUp', 'thumbDown', 'copy'],
}) => {
  const { feedbackResult, sendFeedback } = useFeedback(
    interaction,
    httpSetup,
    dataSourceService,
    usageCollection,
    metricAppName
  );

  const handleFeedback = useCallback(
    (correct: boolean) => {
      if (feedbackResult !== undefined) {
        return;
      }
      sendFeedback(correct, message);
    },
    [feedbackResult, message, sendFeedback]
  );

  const renderButtonWithTooltip = (
    content: string,
    button: JSX.Element,
    key: string,
    showDivider: boolean = false // show a divider to the left of this button
  ) => {
    const buttonWithTooltip = (
      <EuiToolTip
        key={key}
        delay="long"
        content={i18n.translate(`assistantDashboards.messageActions.${key}`, {
          defaultMessage: content,
        })}
      >
        {button}
      </EuiToolTip>
    );
    if (showDivider) {
      return (
        <EuiFlexGroup gutterSize="xs" alignItems="center">
          <EuiFlexItem grow={false}>
            <div className="buttonGroupDivider" />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>{buttonWithTooltip}</EuiFlexItem>
        </EuiFlexGroup>
      );
    }
    return buttonWithTooltip;
  };

  const feedbackTip = i18n.translate(`assistantDashboards.messageActions.feedbackTip`, {
    defaultMessage: 'We have successfully received your feedback. Thank you.',
  });

  const buttonConfigs = {
    copy: {
      show: !isFullWidth,
      component: renderButtonWithTooltip(
        'Copy to clipboard',
        <EuiCopy textToCopy={contentToCopy}>
          {(copy) => (
            <EuiSmallButtonIcon
              aria-label="copy message"
              onClick={copy}
              color="text"
              iconType="copy"
            />
          )}
        </EuiCopy>,
        'copy',
        true
      ),
    },
    regenerate: {
      show: showRegenerate && onRegenerate,
      component: renderButtonWithTooltip(
        'Regenerate message',
        <EuiSmallButtonIcon
          aria-label="regenerate message"
          onClick={onRegenerate}
          color="text"
          iconType="refresh"
        />,
        'regenerate'
      ),
    },
    thumbUp: {
      show: showFeedback && feedbackResult !== false,
      component: renderButtonWithTooltip(
        feedbackResult === true ? feedbackTip : 'Good response',
        <EuiSmallButtonIcon
          aria-label="feedback thumbs up"
          color={feedbackResult === true ? 'primary' : 'text'}
          iconType="thumbsUp"
          onClick={() => handleFeedback(true)}
        />,
        'thumbUp'
      ),
    },
    thumbDown: {
      show: showFeedback && feedbackResult !== true,
      component: renderButtonWithTooltip(
        feedbackResult === false ? feedbackTip : 'Bad response',
        <EuiSmallButtonIcon
          aria-label="feedback thumbs down"
          color={feedbackResult === false ? 'primary' : 'text'}
          iconType="thumbsDown"
          onClick={() => handleFeedback(false)}
        />,
        'thumbDown'
      ),
    },
    trace: {
      show: showTraceIcon && onViewTrace,
      component: renderButtonWithTooltip(
        traceTip,
        <EuiSmallButtonIcon
          aria-label="How was this generated?"
          {...(traceInteractionId && {
            'data-test-subj': `trace-icon-${traceInteractionId}`,
          })}
          onClick={onViewTrace}
          color={isOnTrace ? 'primary' : 'text'}
          iconType="iInCircle"
        />,
        'trace'
      ),
    },
  };

  return (
    <EuiFlexGroup
      aria-label="message actions"
      className={shouldActionBarVisibleOnHover ? 'llm-chat-action-buttons-hidden' : ''}
      responsive={false}
      gutterSize="xs"
      alignItems="center"
      justifyContent="flexEnd"
    >
      {buttonOrder.map(
        (key) =>
          buttonConfigs[key as ButtonKey].show && (
            <EuiFlexItem grow={false} key={key}>
              {buttonConfigs[key as ButtonKey].component}
            </EuiFlexItem>
          )
      )}
    </EuiFlexGroup>
  );
};
