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
      <EuiTitle size="s">
        <h3>{props.title}</h3>
      </EuiTitle>
      {props.runs.map((run) => (
        <div key={run.id}>
          <EuiSpacer size="s" />
          <EuiText>{`${run.name} (${new Date(run.startTime).toLocaleString()})`}</EuiText>
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
    content = (
      <>
        <TraceRuns title="Tools" runs={data.toolRuns} />
        <TraceRuns title="Chains" runs={data.chainRuns} />
        <TraceRuns title="LLMs" runs={data.llmRuns} />
      </>
    );
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
