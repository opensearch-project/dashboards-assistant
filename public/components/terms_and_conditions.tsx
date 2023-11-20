/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiEmptyPrompt, EuiLink, EuiText } from '@elastic/eui';

interface Props {
  username: string;
}

export const TermsAndConditions = (props: Props) => {
  return (
    <EuiEmptyPrompt
      style={{ padding: 0 }}
      iconType="cheer"
      iconColor="primary"
      titleSize="s"
      body={
        <EuiText color="default">
          <p>Welcome {props.username} to the OpenSearch Assistant</p>
          <p>I can help you analyze data, create visualizations, and get other insights.</p>
          <p>How can I help?</p>
          <EuiText size="xs" color="subdued">
            The OpenSearch Assistant may produce inaccurate information. Verify all information
            before using it in any environment or workload.
          </EuiText>
        </EuiText>
      }
      actions={[
        <EuiText size="xs">
          <EuiLink target="_blank" href="/">
            Terms & Conditions
          </EuiLink>
        </EuiText>,
      ].filter(Boolean)}
    />
  );
};