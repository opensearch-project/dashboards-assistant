/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import React from 'react';

interface LoadingButtonProps {
  message?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = (props) => {
  return (
    <EuiFlexGroup>
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty onClick={() => {}} isLoading>
          {props.message || 'Loading...'}
        </EuiButtonEmpty>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
