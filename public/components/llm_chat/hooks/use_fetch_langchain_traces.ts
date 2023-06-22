/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SearchHit, SearchResponse } from '@opensearch-project/opensearch/api/types';
import { ChainRun, LLMRun, ToolRun } from 'langchain/dist/callbacks/handlers/tracer_langchain_v1';
import { useEffect, useReducer } from 'react';
import { HttpStart } from '../../../../../../src/core/public';
import { SearchRequest } from '../../../../../../src/plugins/data/common';
import { DSL_BASE, DSL_SEARCH } from '../../../../common/constants/shared';
import { genericReducer, GenericReducer } from './fetch_reducer';

export interface LangchainTrace {
  id: string;
  startTime: number;
  name: string;
  input: string;
  output?: string;
}

export interface LangchainTraces {
  toolRuns: LangchainTrace[];
  chainRuns: LangchainTrace[];
  llmRuns: LangchainTrace[];
}

type RunHit = SearchResponse<ToolRun | ChainRun | LLMRun>;

const parseToolRuns = (traces: LangchainTraces, toolRuns: ToolRun[]) => {
  traces.toolRuns.push(
    ...toolRuns.map((run) => ({
      id: run.uuid,
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

const parseChainRuns = (traces: LangchainTraces, chainRuns: ChainRun[]) => {
  traces.chainRuns.push(
    ...chainRuns.map((run) => ({
      id: run.uuid,
      startTime: run.start_time,
      name: run.serialized.name,
      input:
        run.inputs.input ||
        run.inputs.question + '\n' + JSON.stringify(run.inputs.input_documents || '', null, 2),
      output:
        run.outputs?.text + '\n' + JSON.stringify(run.outputs?.sourceDocuments || '', null, 2),
    }))
  );
  chainRuns.forEach((run) => {
    if (run.child_tool_runs?.length) parseToolRuns(traces, run.child_tool_runs);
    if (run.child_chain_runs?.length) parseChainRuns(traces, run.child_chain_runs);
    if (run.child_llm_runs?.length) parseLLMRuns(traces, run.child_llm_runs);
  });
};

const parseLLMRuns = (traces: LangchainTraces, llmRuns: LLMRun[]) => {
  traces.llmRuns.push(
    ...llmRuns.map((run) => ({
      id: run.uuid,
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

const convertToTraces = (hits: RunHit): LangchainTraces => {
  const traces: LangchainTraces = {
    toolRuns: [],
    chainRuns: [],
    llmRuns: [],
  };

  hits.hits.hits.forEach((hit) => {
    if (isToolRun(hit)) parseToolRuns(traces, [hit._source!]);
    if (isChainRun(hit)) parseChainRuns(traces, [hit._source!]);
    if (isLLMRun(hit)) parseLLMRuns(traces, [hit._source!]);
  });

  traces.toolRuns.sort((r1, r2) => r1.startTime - r2.startTime);
  traces.chainRuns.sort((r1, r2) => r1.startTime - r2.startTime);
  traces.llmRuns.sort((r1, r2) => r1.startTime - r2.startTime);

  return traces;
};

export const useFetchLangchainTraces = (http: HttpStart, sessionId: string) => {
  const reducer: GenericReducer<LangchainTraces> = genericReducer;
  const [state, dispatch] = useReducer(reducer, { loading: false });

  useEffect(() => {
    const abortController = new AbortController();
    dispatch({ type: 'request' });
    if (!sessionId) {
      dispatch({ type: 'success', payload: undefined });
      return;
    }

    const query: SearchRequest['body'] = {
      query: {
        term: {
          session_id: sessionId,
        },
      },
      sort: [
        {
          start_time: {
            order: 'asc',
          },
        },
      ],
    };

    http
      .post<RunHit>(`${DSL_BASE}${DSL_SEARCH}`, {
        body: JSON.stringify({ index: 'langchain', size: 100, ...query }),
        signal: abortController.signal,
      })
      .then((payload) => dispatch({ type: 'success', payload: convertToTraces(payload) }))
      .catch((error) => dispatch({ type: 'failure', error }));

    return () => abortController.abort();
  }, [sessionId]);

  return { ...state };
};
