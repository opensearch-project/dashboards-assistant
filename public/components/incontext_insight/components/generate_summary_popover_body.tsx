/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButton } from '@elastic/eui';
import React from 'react';
import { IToasts } from '../../../../../../src/core/public';

export interface GenerateSummaryPopoverBodyProps {
  toasts: IToasts;
}

export const GenerateSummaryPopoverBody: React.FC<GenerateSummaryPopoverBodyProps> = ({
  toasts,
}) => (
  <EuiButton onClick={() => toasts.addDanger('To be implemented...')}>Generate summary</EuiButton>
);
