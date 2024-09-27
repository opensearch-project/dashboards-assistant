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
  const [feedback, setFeedback] = useState<'thumbs_up' | 'thumbs_down' | undefined>();

  const onFeedback = (eventName: 'thumbs_up' | 'thumbs_down') => {
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
      {(!feedback || feedback === 'thumbs_up') && (
        <EuiFlexItem>
          <EuiButtonIcon
            size="xs"
            color={feedback === 'thumbs_up' ? 'primary' : 'text'}
            iconType="thumbsUp"
            aria-label="ThumbsUp"
            onClick={() => onFeedback('thumbs_up')}
          />
        </EuiFlexItem>
      )}
      {(!feedback || feedback === 'thumbs_down') && (
        <EuiFlexItem>
          <EuiButtonIcon
            size="xs"
            color={feedback === 'thumbs_down' ? 'primary' : 'text'}
            iconType="thumbsDown"
            aria-label="ThumbsDown"
            onClick={() => onFeedback('thumbs_down')}
          />
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};
