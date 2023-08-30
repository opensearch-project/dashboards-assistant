/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IMessage } from '../../../../common/types/chat_saved_object_attributes';
import { LangchainTrace } from '../../../../common/utils/llm_chat/traces';
import { PPLTools } from '../../tools/tool_sets/ppl';
import { filterToolOutput, mergeMessages } from './utils';

const extractPPLQueries = (content: string) => {
  return Array.from(content.matchAll(/(^|[\n\r]|:)\s*(source\s*=\s*.+)/gi)).map(
    (match) => match[2]
  );
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

export const buildPPLOutputs = (
  traces: LangchainTrace[],
  outputs: IMessage[],
  question: string
): IMessage[] => {
  const ppls = traces
    .filter(filterToolOutput(PPLTools.TOOL_NAMES.QUERY_OPENSEARCH))
    .flatMap((trace) => extractPPLQueries(trace.output));
  if (!ppls.length) return outputs;

  const statsPPLs = ppls.filter((ppl) => /\|\s*stats\s+/i.test(ppl));
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
        metadata: { query, question },
      },
    ],
  }));

  return outputs.concat(visOutputs);
};
