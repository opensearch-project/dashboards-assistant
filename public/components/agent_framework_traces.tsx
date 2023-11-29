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
import { useFetchAgentFrameworkTraces } from '../hooks/use_fetch_agentframework_traces';

interface AgentFrameworkTracesProps {
  traceId: string;
}

export const AgentFrameworkTraces: React.FC<AgentFrameworkTracesProps> = (props) => {
  const { data: traces, loading, error } = useFetchAgentFrameworkTraces(props.traceId);

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
  const result = traces[0].output;
  const questionAndResult = `# How was this generated
#### Question
${question}
#### Result
${result}
`;

  return (
    <>
      <EuiMarkdownFormat>{questionAndResult}</EuiMarkdownFormat>

      <EuiSpacer size="l" />

      <EuiText>
        <h3>Response</h3>
      </EuiText>
      {traces
        .filter((trace) => trace.origin?.includes('Tool') && (trace.input || trace.output))
        .map((trace, i) => {
          const stepContent = `Step ${i + 1}`;
          return (
            <div key={trace.interactionId}>
              <EuiSpacer size="s" />
              <EuiAccordion id={stepContent} buttonContent={stepContent}>
                {trace.input && (
                  <EuiCodeBlock fontSize="m" paddingSize="s">
                    Input: {trace.input}
                  </EuiCodeBlock>
                )}
                {trace.output && (
                  <EuiCodeBlock fontSize="m" paddingSize="s">
                    Output: {trace.output}
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
