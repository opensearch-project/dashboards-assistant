/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mergeWith } from 'lodash';
import { IMessage } from '../../../common/types/observability_saved_object_attributes';
import { AgentFactory } from '../agents/agent_factory/agent_factory';

// TODO remove when typescript is upgraded to >= 4.5
type Awaited<T> = T extends Promise<infer U> ? U : T;
type AgentResponse = Awaited<ReturnType<InstanceType<typeof AgentFactory>['run']>>;
interface SuggestedQuestions {
  [x: string]: string;
}

export const convertToOutputs = (
  agentResponse: AgentResponse,
  sessionId: string,
  suggestions: SuggestedQuestions
) => {
  const content = extractContent(agentResponse);
  let outputs: IMessage[] = [
    {
      type: 'output',
      content,
      contentType: 'markdown',
    },
  ];
  outputs = buildPPLOutputs(content, outputs);
  outputs = buildTraces(sessionId, outputs); // keep at last
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

const mergeMessages = (message: IMessage, ...messages: Array<Partial<IMessage>>) => {
  return mergeWith(
    message,
    ...messages,
    (obj: IMessage[keyof IMessage], src: IMessage[keyof IMessage]) => {
      if (Array.isArray(obj)) return obj.concat(src);
    }
  ) as IMessage;
};

const buildTraces = (sessionId: string, outputs: IMessage[]): IMessage[] => {
  const viewDetails: Partial<IMessage> = {
    suggestedActions: [
      {
        message: 'Explain',
        metadata: { sessionId },
        actionType: 'view_details',
      },
    ],
  };
  outputs[outputs.length - 1] = mergeMessages(outputs.at(-1)!, viewDetails);
  return outputs;
};

const buildSuggestions = (suggestions: SuggestedQuestions, outputs: IMessage[]) => {
  const suggestionsOutput: Partial<IMessage> = {
    suggestedActions: [
      {
        message: suggestions.question1,
        actionType: 'send_as_input',
      },
      {
        message: suggestions.question2,
        actionType: 'send_as_input',
      },
    ],
  };
  outputs[outputs.length - 1] = mergeMessages(outputs.at(-1)!, suggestionsOutput);
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
