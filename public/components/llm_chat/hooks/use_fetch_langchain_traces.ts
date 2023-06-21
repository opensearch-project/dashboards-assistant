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

export type LangchainTraces = ReturnType<typeof convertToTraces>;

interface RunHit {
  child_tool_runs?: ToolRun;
  child_llm_runs?: LLMRun;
  child_chain_runs?: ChainRun;
}

function defined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

const convertToTraces = (hits: Array<SearchHit<RunHit>>) => {
  const toolRuns: LangchainTrace[] = hits
    .flatMap((hit) => hit._source?.child_tool_runs)
    .filter(defined)
    .map((run) => ({
      id: run.uuid,
      startTime: run.start_time,
      name: run.serialized.name,
      input: run.tool_input,
      output: run.output,
    }));
  const llmRuns: LangchainTrace[] = hits
    .flatMap((hit) => hit._source?.child_llm_runs)
    .filter(defined)
    .map((run) => ({
      id: run.uuid,
      startTime: run.start_time,
      name: run.serialized.name,
      input: run.prompts.join('\n'),
      output: run.response?.generations
        .flatMap((generation) => generation.map((res) => res.text))
        .join('\n'),
    }));
  const chainRuns: LangchainTrace[] = hits
    .flatMap((hit) => hit._source?.child_chain_runs)
    .filter(defined)
    .map((run) => ({
      id: run.uuid,
      startTime: run.start_time,
      name: run.serialized.name,
      input: run.inputs.input,
      output: run.outputs?.text,
    }));
  return { toolRuns, llmRuns, chainRuns };
};

export const useFetchLangchainTraces = (http: HttpStart, sessionId: string) => {
  const reducer: GenericReducer<ReturnType<typeof convertToTraces>> = genericReducer;
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
      .post<SearchResponse<RunHit>>(`${DSL_BASE}${DSL_SEARCH}`, {
        body: JSON.stringify({ index: 'langchain', size: 100, ...query }),
        signal: abortController.signal,
      })
      .then((payload) => dispatch({ type: 'success', payload: convertToTraces(payload.hits.hits) }))
      .catch((error) => dispatch({ type: 'failure', error }));

    return () => abortController.abort();
  }, [sessionId]);

  return { ...state };
};
