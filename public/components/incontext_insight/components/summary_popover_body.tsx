/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiText, EuiPanel } from '@elastic/eui';
import React from 'react';
import { IncontextInsight as IncontextInsightInput } from '../../../types';

export interface SummaryPopoverBodyProps {
  incontextInsight: IncontextInsightInput;
}

export const SummaryPopoverBody: React.FC<SummaryPopoverBodyProps> = ({ incontextInsight }) => (
  <EuiPanel paddingSize="s" hasBorder hasShadow={false} color="subdued">
    <EuiText size="s">{incontextInsight.summary}</EuiText>
  </EuiPanel>
);
