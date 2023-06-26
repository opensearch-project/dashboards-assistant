/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButtonEmpty, EuiModalBody, EuiModalFooter, EuiModalHeader } from '@elastic/eui';
import React from 'react';
import { HttpStart } from '../../../../../../src/core/public';
import { useFetchLangchainTraces } from '../hooks/use_fetch_langchain_traces';
import { LangchainTraces } from './langchain_traces';

interface LangchainTracesModalProps {
  sessionId: string;
  http: HttpStart;
  onClose: () => void;
}

export const LangchainTracesModal: React.FC<LangchainTracesModalProps> = (props) => {
  const fetchState = useFetchLangchainTraces(props.http, props.sessionId);

  return (
    <>
      <EuiModalHeader />

      <EuiModalBody>
        <LangchainTraces fetchState={fetchState} />
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={props.onClose}>Close</EuiButtonEmpty>
      </EuiModalFooter>
    </>
  );
};
