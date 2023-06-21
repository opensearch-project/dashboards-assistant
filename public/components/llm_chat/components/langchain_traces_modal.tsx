/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiAccordion,
  EuiButtonEmpty,
  EuiCode,
  EuiEmptyPrompt,
  EuiLoadingContent,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import React from 'react';
import { HttpStart } from '../../../../../../src/core/public';
import { LangchainTrace, useFetchLangchainTraces } from '../hooks/use_fetch_langchain_traces';

interface TraceRunsProps {
  title: string;
  runs: LangchainTrace[];
}

const TraceRuns: React.FC<TraceRunsProps> = (props) => {
  if (!props.runs.length) return null;
  return (
    <>
      <EuiTitle>
        <h5>{props.title}</h5>
      </EuiTitle>
      {props.runs.map((run) => (
        <>
          <EuiText>{`${run.name} (${run.id})`}</EuiText>
          <EuiAccordion id="input-accordion" buttonContent="Input">
            <EuiPanel color="subdued">
              <EuiCode style={{ whiteSpace: 'pre-wrap' }}>{run.input}</EuiCode>
            </EuiPanel>
          </EuiAccordion>
          <EuiAccordion id="output-accordion" buttonContent="Output">
            <EuiPanel color="subdued">
              <EuiCode style={{ whiteSpace: 'pre-wrap' }}>{run.output}</EuiCode>
            </EuiPanel>
          </EuiAccordion>
        </>
      ))}
      <EuiSpacer />
    </>
  );
};

interface LangchainTracesModalProps {
  sessionId: string;
  http: HttpStart;
  onClose: () => void;
}

export const LangchainTracesModal: React.FC<LangchainTracesModalProps> = (props) => {
  const { data, loading, error } = useFetchLangchainTraces(props.http, props.sessionId);

  let content: React.ReactNode;
  if (loading) {
    content = <EuiLoadingContent lines={10} />;
  } else if (!data) {
    content = <EuiText>Data not available.</EuiText>;
  } else if (error) {
    content = (
      <EuiEmptyPrompt
        iconType="alert"
        iconColor="danger"
        title={<h2>Error loading details</h2>}
        body={error}
      />
    );
  } else {
    content = (
      <>
        <TraceRuns title="Tools" runs={data.toolRuns} />
        <TraceRuns title="LLMs" runs={data.llmRuns} />
        <TraceRuns title="Chains" runs={data.chainRuns} />
      </>
    );
  }

  return (
    <>
      <EuiModalHeader>
        <EuiModalHeaderTitle>View details</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <div>{content}</div>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={props.onClose}>Close</EuiButtonEmpty>
      </EuiModalFooter>
    </>
  );
};
