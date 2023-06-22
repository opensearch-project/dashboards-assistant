/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiAccordion,
  EuiButtonEmpty,
  EuiCodeBlock,
  EuiEmptyPrompt,
  EuiLoadingContent,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import React from 'react';
import { HttpStart } from '../../../../../../src/core/public';
import { LangchainTrace, useFetchLangchainTraces } from '../hooks/use_fetch_langchain_traces';

interface TraceRunsProps {
  runs: LangchainTrace[];
}

// workaround to show Claude LLM as OpenSearch LLM
const formatRunDisplay = (run: LangchainTrace) => {
  return (
    <span>
      <strong>{run.type}</strong>: {run.name.replace('anthropic', 'OpenSearch LLM')}(
      {new Date(run.startTime).toLocaleString()})
    </span>
  );
};

const TraceRuns: React.FC<TraceRunsProps> = (props) => {
  if (!props.runs.length) return null;

  return (
    <>
      {props.runs.map((run) => (
        <div key={run.id}>
          <EuiSpacer size="s" />
          <EuiText>{formatRunDisplay(run)}</EuiText>
          <EuiAccordion id="input-accordion" buttonContent="Input">
            <EuiCodeBlock fontSize="m">{run.input}</EuiCodeBlock>
          </EuiAccordion>
          <EuiAccordion id="output-accordion" buttonContent="Output">
            <EuiCodeBlock fontSize="m">{run.output}</EuiCodeBlock>
          </EuiAccordion>
        </div>
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
    content = (
      <>
        <EuiText>Loading...</EuiText>
        <EuiLoadingContent lines={10} />
      </>
    );
  } else if (error) {
    content = (
      <EuiEmptyPrompt
        iconType="alert"
        iconColor="danger"
        title={<h2>Error loading details</h2>}
        body={error}
      />
    );
  } else if (!data) {
    content = <EuiText>Data not available.</EuiText>;
  } else {
    content = <TraceRuns runs={data} />;
  }

  return (
    <>
      <EuiModalHeader>
        <EuiModalHeaderTitle>View details</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>{content}</EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={props.onClose}>Close</EuiButtonEmpty>
      </EuiModalFooter>
    </>
  );
};
