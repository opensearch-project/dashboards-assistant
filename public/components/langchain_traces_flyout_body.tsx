/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonEmpty, EuiFlyoutBody } from '@elastic/eui';
import React from 'react';
import { LangchainTraces } from './langchain_traces';

interface LangchainTracesFlyoutBodyProps {
  sessionId: string;
  closeFlyout: () => void;
}

export const LangchainTracesFlyoutBody: React.FC<LangchainTracesFlyoutBodyProps> = (props) => {
  return (
    <EuiFlyoutBody>
      <EuiButtonEmpty
        style={{ marginTop: 5, marginLeft: 5 }}
        size="l"
        onClick={props.closeFlyout}
        iconType="arrowLeft"
      >
        Back
      </EuiButtonEmpty>
      <div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 24 }}>
        <LangchainTraces sessionId={props.sessionId} />
      </div>
    </EuiFlyoutBody>
  );
};
