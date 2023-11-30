/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { IMessage } from '../../../../common/types/chat_saved_object_attributes';
import { LangchainTrace } from '../../../../common/utils/llm_chat/traces';
import { buildPPLOutputs } from './ppl';
import { buildSuggestions, SuggestedQuestions } from './suggestions';

export const buildOutputs = (
  question: string,
  agentResponse: AgentResponse,
  traceId: string,
  suggestions: SuggestedQuestions,
  traces: LangchainTrace[]
) => {
  const content = extractContent(agentResponse);
  let outputs: IMessage[] = [
    {
      type: 'output',
      traceId,
      content,
      contentType: 'markdown',
    },
  ];
  outputs = buildToolsUsed(traces, outputs);
  outputs = buildPPLOutputs(traces, outputs, question);
  outputs = buildSuggestions(suggestions, outputs);
  return sanitize(outputs);
};

const extractContent = (agentResponse: AgentResponse) => {
  return typeof agentResponse === 'string' ? agentResponse : (agentResponse.output as string);
};

const buildToolsUsed = (traces: LangchainTrace[], outputs: IMessage[]) => {
  const tools = traces.filter((trace) => trace.type === 'tool').map((tool) => tool.name);
  if (outputs[0].type !== 'output') throw new Error('First output message type should be output.');
  outputs[0].toolsUsed = tools;
  return outputs;
};

const sanitize = (outputs: IMessage[]) => {
  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify((window as unknown) as Window);
  return outputs.map((output) => ({
    ...output,
    ...(output.contentType === 'markdown' && {
      content: DOMPurify.sanitize(output.content, { FORBID_TAGS: ['img'] }).replace(/!+\[/g, '['),
    }),
  }));
};
