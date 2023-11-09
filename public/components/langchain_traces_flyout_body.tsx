/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonEmpty,
  EuiFlyoutBody,
  EuiPage,
  EuiPageBody,
  EuiPageContentBody,
  EuiPageHeader,
} from '@elastic/eui';
import React from 'react';
import { LangchainTraces } from './langchain_traces';

interface LangchainTracesFlyoutBodyProps {
  traceId: string;
  closeFlyout: () => void;
}

export const LangchainTracesFlyoutBody: React.FC<LangchainTracesFlyoutBodyProps> = (props) => {
  return (
    <EuiFlyoutBody className="llm-chat-flyout">
      <EuiPage>
        <EuiPageBody>
          <EuiPageHeader>
            <EuiButtonEmpty
              style={{ marginLeft: '-8px' }}
              size="xs"
              onClick={props.closeFlyout}
              iconType="arrowLeft"
            >
              Back
            </EuiButtonEmpty>
          </EuiPageHeader>
          <EuiPageContentBody>
            <LangchainTraces traceId={props.traceId} />
          </EuiPageContentBody>
        </EuiPageBody>
      </EuiPage>
    </EuiFlyoutBody>
  );
};
