/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiAccordion,
  EuiCodeBlock,
  EuiEmptyPrompt,
  EuiLoadingContent,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import React from 'react';
import { LangchainTrace, useFetchLangchainTraces } from '../hooks/use_fetch_langchain_traces';

// workaround to show Claude LLM as OpenSearch LLM
const formatRunName = (run: LangchainTrace) =>
  `${run.name.replace('anthropic', 'OpenSearch LLM')} (${new Date(
    run.startTime
  ).toLocaleString()})`;

interface LangchainTracesProps {
  sessionId: string;
}

export const LangchainTraces: React.FC<LangchainTracesProps> = (props) => {
  const { data: runs, loading, error } = useFetchLangchainTraces(props.sessionId);

  if (loading) {
    return (
      <>
        <EuiText>Loading...</EuiText>
        <EuiLoadingContent lines={10} />
      </>
    );
  }
  if (error) {
    return (
      <EuiEmptyPrompt
        iconType="alert"
        iconColor="danger"
        title={<h2>Error loading details</h2>}
        body={error}
      />
    );
  }
  if (!runs) {
    return <EuiText>Data not available.</EuiText>;
  }

  return (
    <>
      <EuiText size="s">
        <h1>Response</h1>
      </EuiText>
      {runs
        .filter((run) => run.input || run.output)
        .map((run) => (
          <div key={run.id}>
            <EuiSpacer size="s" />
            <EuiText>{formatRunName(run)}</EuiText>
            {run.input && (
              <EuiAccordion id="input-accordion" buttonContent="Input">
                <EuiCodeBlock fontSize="m">{run.input}</EuiCodeBlock>
              </EuiAccordion>
            )}
            {run.output && (
              <EuiAccordion id="output-accordion" buttonContent="Output">
                <EuiCodeBlock fontSize="m">{run.output}</EuiCodeBlock>
              </EuiAccordion>
            )}
          </div>
        ))}
    </>
  );
};
