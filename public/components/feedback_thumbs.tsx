/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { UsageCollectionStart } from '../../../../src/plugins/usage_collection/public';

interface Props {
  appName: string;
  usageCollection: UsageCollectionStart;
  className?: string;
}

export const FeedbackThumbs = ({ usageCollection, appName, className }: Props) => {
  const [feedback, setFeedback] = useState<'thumbup' | 'thumbdown' | undefined>();

  const onFeedback = (eventName: 'thumbup' | 'thumbdown') => {
    // Only send metric if no current feedback set
    if (!feedback) {
      usageCollection.reportUiStats(
        appName,
        usageCollection.METRIC_TYPE.CLICK,
        `${eventName}-${uuidv4()}`
      );
      setFeedback(eventName);
    }
  };

  return (
    <EuiFlexGroup gutterSize="none" className={className}>
      {(!feedback || feedback === 'thumbup') && (
        <EuiFlexItem>
          <EuiButtonIcon
            size="xs"
            color={feedback === 'thumbup' ? 'primary' : 'text'}
            iconType="thumbsUp"
            aria-label="ThumbsUp"
            onClick={() => onFeedback('thumbup')}
          />
        </EuiFlexItem>
      )}
      {(!feedback || feedback === 'thumbdown') && (
        <EuiFlexItem>
          <EuiButtonIcon
            size="xs"
            color={feedback === 'thumbdown' ? 'primary' : 'text'}
            iconType="thumbsDown"
            aria-label="ThumbsDown"
            onClick={() => onFeedback('thumbdown')}
          />
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};
