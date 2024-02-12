/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButton, EuiFieldText, EuiFlexGroup, EuiFlexItem, EuiFormRow } from '@elastic/eui';
import React from 'react';
import { IToasts } from '../../../../../../src/core/public';

export interface ChatPopoverBodyProps {
  toasts: IToasts;
}

export const ChatPopoverBody: React.FC<ChatPopoverBodyProps> = ({ toasts }) => (
  <EuiFlexGroup>
    <EuiFlexItem grow={6}>
      <EuiFormRow>
        <EuiFieldText placeholder="Ask a question" />
      </EuiFormRow>
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiButton
        fill
        iconType="returnKey"
        iconSide="right"
        onClick={() => toasts.addDanger('To be implemented...')}
      >
        Go
      </EuiButton>
    </EuiFlexItem>
  </EuiFlexGroup>
);
