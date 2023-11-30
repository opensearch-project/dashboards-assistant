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
  EuiMarkdownFormat,
  EuiHorizontalRule,
} from '@elastic/eui';
import React from 'react';
import { LangchainTrace } from '../../common/utils/llm_chat/traces';
import { useFetchLangchainTraces } from '../hooks/use_fetch_langchain_traces';

// workaround to show LLM name as OpenSearch LLM
const formatRunName = (run: LangchainTrace) => {
  if (run.type === 'llm') return 'OpenSearch LLM';
  return run.name;
};

interface LangchainTracesProps {
  traceId: string;
}

export const Traces: React.FC<LangchainTracesProps> = (props) => {
  const { data: traces, loading, error } = useFetchLangchainTraces(props.traceId);

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
        body={error.toString()}
      />
    );
  }
  if (!traces?.length) {
    return <EuiText>Data not available.</EuiText>;
  }

  const question = traces[0].input;
  const finalAnswer = traces[0].output;
  const questionAndAnswer = `
  # How was this generated
  #### Question
  ${question}
  #### Result
  ${finalAnswer}
  `;

  return (
    <>
      <EuiMarkdownFormat>{questionAndAnswer}</EuiMarkdownFormat>

      <EuiSpacer size="l" />

      <EuiText>
        <h3>Response</h3>
      </EuiText>
      {traces
        .filter((run) => run.type === 'tool')
        .filter((run) => run.input || run.output)
        .map((run, i) => {
          const stepContent = `Step ${i + 1} - ${formatRunName(run)}`;
          return (
            <div key={run.id}>
              <EuiSpacer size="s" />
              <EuiAccordion id={stepContent} buttonContent={stepContent}>
                {run.input && (
                  <EuiCodeBlock fontSize="m" paddingSize="s">
                    Input: {run.input}
                  </EuiCodeBlock>
                )}
                {run.output && (
                  <EuiCodeBlock fontSize="m" paddingSize="s">
                    Output: {run.output}
                  </EuiCodeBlock>
                )}
              </EuiAccordion>
              <EuiHorizontalRule margin="xs" />
            </div>
          );
        })}
    </>
  );
};
