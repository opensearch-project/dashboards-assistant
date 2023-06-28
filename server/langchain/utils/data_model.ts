/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mergeWith } from 'lodash';
import {
  IMessage,
  ISuggestedAction,
} from '../../../common/types/observability_saved_object_attributes';
import { LangchainTrace } from '../../../common/utils/llm_chat/traces';
import { AgentFactory } from '../agents/agent_factory/agent_factory';

// TODO remove when typescript is upgraded to >= 4.5
type Awaited<T> = T extends Promise<infer U> ? U : T;
type AgentResponse = Awaited<ReturnType<InstanceType<typeof AgentFactory>['run']>>;
type SuggestedQuestions = Record<string, string>;

export const convertToOutputs = (
  agentResponse: AgentResponse,
  sessionId: string,
  suggestions: SuggestedQuestions,
  traces: LangchainTrace[] | void
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
  outputs = buildPPLOutputs(content, outputs);
  outputs = buildSuggestions(suggestions, outputs);
  return outputs;
};

export const extractContent = (agentResponse: AgentResponse) => {
  return typeof agentResponse === 'string' ? agentResponse : (agentResponse.output as string);
};

const extractPPLQueries = (content: string) => {
  return (
    Array.from(content.matchAll(/(^|[\n\r]|:)\s*(source\s*=\s*.+)/g)).map((match) => match[2]) || []
  );
};

/**
 * Merges a list of partial messages into a given IMessage object.
 * @returns merged
 */
const mergeMessages = (message: IMessage, ...messages: Array<Partial<IMessage>>) => {
  return mergeWith(
    message,
    ...messages,
    (obj: IMessage[keyof IMessage], src: IMessage[keyof IMessage]) => {
      if (Array.isArray(obj)) return obj.concat(src);
    }
  ) as IMessage;
};

const buildSuggestions = (suggestions: SuggestedQuestions, outputs: IMessage[]) => {
  const suggestedActions: ISuggestedAction[] = [];

  if (suggestions.question1) {
    suggestedActions.push({
      message: suggestions.question1,
      actionType: 'send_as_input',
    });
  }

  if (suggestions.question2) {
    suggestedActions.push({
      message: suggestions.question2,
      actionType: 'send_as_input',
    });
  }
  outputs[outputs.length - 1] = mergeMessages(outputs.at(-1)!, { suggestedActions });
  return outputs;
};

const buildToolsUsed = (traces: LangchainTrace[] | void, outputs: IMessage[]) => {
  if (!traces) return outputs;
  const tools = traces.filter((trace) => trace.type === 'tool').map((tool) => tool.name);
  outputs[0].toolsUsed = tools;
  return outputs;
};

const buildPPLOutputs = (content: string, outputs: IMessage[]): IMessage[] => {
  const ppls = extractPPLQueries(content);
  if (!ppls.length) return outputs;

  const statsPPLs = ppls.filter((ppl) => /\|\s*stats\s+/.test(ppl));
  if (!statsPPLs.length) {
    outputs[0] = mergeMessages(outputs[0], convertToSavePPLActions(ppls));
    return outputs;
  }

  const visOutputs: IMessage[] = statsPPLs.map((query) => ({
    type: 'output',
    content: query,
    contentType: 'ppl_visualization',
    suggestedActions: [
      {
        message: 'View details',
        actionType: 'view_ppl_visualization',
        metadata: { query },
      },
    ],
  }));

  return outputs.concat(visOutputs);
};

const convertToSavePPLActions = (queries: string[]): Partial<IMessage> => {
  return {
    suggestedActions: queries.map((query, i, arr) => ({
      message: `Save query ${arr.length > 1 ? `(${i}) ` : ''}and view in Event Analytics`,
      metadata: { query },
      actionType: 'save_and_view_ppl_query',
    })),
  };
};
