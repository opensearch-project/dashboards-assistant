/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IMessage } from '../../../../common/types/observability_saved_object_attributes';
import { LangchainTrace } from '../../../../common/utils/llm_chat/traces';
import { AgentFactory } from '../../agents/agent_factory/agent_factory';
import { buildPPLOutputs } from './ppl';
import { buildCoreVisualizations } from './saved_objects';
import { SuggestedQuestions, buildSuggestions } from './suggestions';

// TODO remove when typescript is upgraded to >= 4.5
type Awaited<T> = T extends Promise<infer U> ? U : T;
type AgentResponse = Awaited<ReturnType<InstanceType<typeof AgentFactory>['run']>>;

export const buildOutputs = (
  agentResponse: AgentResponse,
  sessionId: string,
  suggestions: SuggestedQuestions,
  traces: LangchainTrace[]
) => {
  const content = extractContent(agentResponse);
  let outputs: IMessage[] = [
    {
      type: 'output',
      sessionId,
      content,
      contentType: 'markdown',
    },
  ];
  outputs = buildToolsUsed(traces, outputs);
  outputs = buildPPLOutputs(traces, outputs);
  outputs = buildCoreVisualizations(traces, outputs);
  outputs = buildSuggestions(suggestions, outputs);
  return outputs;
};

const extractContent = (agentResponse: AgentResponse) => {
  return typeof agentResponse === 'string' ? agentResponse : (agentResponse.output as string);
};

const buildToolsUsed = (traces: LangchainTrace[], outputs: IMessage[]) => {
  const tools = traces.filter((trace) => trace.type === 'tool').map((tool) => tool.name);
  outputs[0].toolsUsed = tools;
  return outputs;
};
