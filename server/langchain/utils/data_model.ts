/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IMessage } from '../../../common/types/observability_saved_object_attributes';
import { AgentFactory } from '../agents/chat_conv_agent';

// TODO remove when typescript is upgraded to >= 4.5
type Awaited<T> = T extends Promise<infer U> ? U : T;

export const convertToOutputs = (
  agentResponse: Awaited<ReturnType<InstanceType<typeof AgentFactory>['run']>>
) => {
  const content =
    typeof agentResponse === 'string' ? agentResponse : (agentResponse.output as string);
  const outputs: IMessage[] = [
    Object.assign(
      {
        type: 'output',
        content,
        contentType: 'markdown',
      },
      convertToSavePPLActions(extractPPLQueries(content))
    ),
  ];
  return outputs;
};

const extractPPLQueries = (content: string) => {
  return content.match(/(^|[\n\r])\s*(source\s*=\s*.+)/g) || [];
};

const convertToSavePPLActions = (queries: string[]): Partial<IMessage> => {
  if (queries.length === 1) {
    return {
      suggestedActions: [
        {
          message: 'Save and view in Event Analytics',
          metadata: { query: queries[0] },
          actionType: 'save_and_view_ppl_query',
        },
      ],
    };
  }
  return {
    suggestedActions: queries.map((query, i) => ({
      message: `Save query (${i}) and view in Event Analytics`,
      metadata: { query },
      actionType: 'save_and_view_ppl_query',
    })),
  };
};
