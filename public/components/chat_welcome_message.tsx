/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiEmptyPrompt, EuiText } from '@elastic/eui';

interface Props {
  username: string;
}

export const WelcomeMessage = (props: Props) => {
  return (
    <EuiEmptyPrompt
      aria-label="chat welcome message"
      iconType="cheer"
      iconColor="primary"
      titleSize="s"
      body={
        <EuiText color="default">
          <p>Welcome {props.username} to the OpenSearch Assistant!</p>
          <p>I can help you analyze data, create visualizations, and get other insights.</p>
          <p>How can I help?</p>
          <EuiText size="xs" color="subdued">
            The OpenSearch Assistant may produce inaccurate information. Verify all information
            before using it in any environment or workload.
          </EuiText>
        </EuiText>
      }
    />
  );
};
