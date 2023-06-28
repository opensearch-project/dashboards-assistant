/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SearchHit, SearchResponse } from '@opensearch-project/opensearch/api/types';
import { ChainRun, LLMRun, ToolRun } from 'langchain/dist/callbacks/handlers/tracer_langchain_v1';

export interface LangchainTrace {
  id: string;
  type: ToolRun['type'] | ChainRun['type'] | LLMRun['type'];
  startTime: number;
  name: string;
  input: string;
  output?: string;
}

interface RunTraces {
  toolRuns: LangchainTrace[];
  chainRuns: LangchainTrace[];
  llmRuns: LangchainTrace[];
}

const parseToolRuns = (traces: RunTraces, toolRuns: ToolRun[]) => {
  traces.toolRuns.push(
    ...toolRuns
      .filter((run) => run.uuid)
      .map((run) => ({
        id: run.uuid,
        type: 'tool' as const,
        startTime: run.start_time,
        name: run.serialized.name,
        input: run.tool_input,
        output: run.output,
      }))
  );
  toolRuns.forEach((run) => {
    if (run.child_tool_runs?.length) parseToolRuns(traces, run.child_tool_runs);
    if (run.child_chain_runs?.length) parseChainRuns(traces, run.child_chain_runs);
    if (run.child_llm_runs?.length) parseLLMRuns(traces, run.child_llm_runs);
  });
};

const parseChainRuns = (traces: RunTraces, chainRuns: ChainRun[]) => {
  traces.chainRuns.push(
    ...chainRuns
      .filter((run) => run.uuid)
      .map((run) => {
        let input = run.inputs.input;
        if (!input) input = run.inputs.question;
        if (run.inputs.input_documents)
          input += '\n\nInput documents:\n' + JSON.stringify(run.inputs.input_documents, null, 2);

        let output = run.outputs?.text;
        if (output && run.outputs?.sourceDocuments)
          output +=
            '\n\nSource documents:\n' + JSON.stringify(run.outputs?.sourceDocuments, null, 2);

        return {
          id: run.uuid,
          type: 'chain' as const,
          startTime: run.start_time,
          name: run.serialized.name,
          input,
          output,
        };
      })
  );
  chainRuns.forEach((run) => {
    if (run.child_tool_runs?.length) parseToolRuns(traces, run.child_tool_runs);
    if (run.child_chain_runs?.length) parseChainRuns(traces, run.child_chain_runs);
    if (run.child_llm_runs?.length) parseLLMRuns(traces, run.child_llm_runs);
  });
};

const parseLLMRuns = (traces: RunTraces, llmRuns: LLMRun[]) => {
  traces.llmRuns.push(
    ...llmRuns
      .filter((run) => run.uuid)
      .map((run) => ({
        id: run.uuid,
        type: 'llm' as const,
        startTime: run.start_time,
        name: run.serialized.name,
        input: run.prompts.join('\n'),
        output: run.response?.generations
          .flatMap((generation) => generation.map((res) => res.text))
          .join('\n'),
      }))
  );
};

const isToolRun = (hit: SearchHit<ToolRun | ChainRun | LLMRun>): hit is SearchHit<ToolRun> =>
  hit._source?.type === 'tool';
const isChainRun = (hit: SearchHit<ToolRun | ChainRun | LLMRun>): hit is SearchHit<ChainRun> =>
  hit._source?.type === 'chain';
const isLLMRun = (hit: SearchHit<ToolRun | ChainRun | LLMRun>): hit is SearchHit<LLMRun> =>
  hit._source?.type === 'llm';

export const convertToTraces = (hits: SearchResponse<ToolRun | ChainRun | LLMRun>) => {
  const traces: RunTraces = {
    toolRuns: [],
    chainRuns: [],
    llmRuns: [],
  };

  hits.hits.hits.forEach((hit) => {
    if (isToolRun(hit)) parseToolRuns(traces, [hit._source!]);
    if (isChainRun(hit)) parseChainRuns(traces, [hit._source!]);
    if (isLLMRun(hit)) parseLLMRuns(traces, [hit._source!]);
  });

  return [...traces.toolRuns, ...traces.chainRuns, ...traces.llmRuns].sort(
    (r1, r2) => r1.startTime - r2.startTime
  );
};
