/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IMessage } from '../../../../common/types/chat_saved_object_attributes';
import { LangchainTrace } from '../../../../common/utils/llm_chat/traces';
import { PPLTools } from '../../tools/tool_sets/ppl';
import { filterToolOutput } from './utils';

const extractPPLQueries = (content: string) => {
  return Array.from(content.matchAll(/(^|[\n\r]|:)\s*(source\s*=\s*.+)/gi)).map(
    (match) => match[2]
  );
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

  const statsPPLs = ppls.filter((ppl) => /\|\s*stats\s+[^|]+\sby\s/i.test(ppl));
  if (!statsPPLs.length) {
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
