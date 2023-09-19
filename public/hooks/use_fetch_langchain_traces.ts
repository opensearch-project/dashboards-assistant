/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Run } from 'langchain/callbacks';
import { useEffect, useReducer } from 'react';
import { SearchResponse } from '../../../../src/core/server';
import { SearchRequest } from '../../../../src/plugins/data/common';
import { DSL_BASE, DSL_SEARCH, LLM_INDEX } from '../../common/constants/llm';
import { LangchainTrace, convertToTraces } from '../../common/utils/llm_chat/traces';
import { useCore } from '../contexts/core_context';
import { GenericReducer, genericReducer } from './fetch_reducer';

// TODO persist traces with chat objects
export const useFetchLangchainTraces = (sessionId: string) => {
  const core = useCore();
  const reducer: GenericReducer<LangchainTrace[]> = genericReducer;
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

    core.services.http
      .post<SearchResponse<Run>>(`${DSL_BASE}${DSL_SEARCH}`, {
        body: JSON.stringify({ index: LLM_INDEX.TRACES, size: 100, ...query }),
        signal: abortController.signal,
      })
      .then((payload) =>
        dispatch({
          type: 'success',
          payload: convertToTraces(payload.hits.hits.map((hit) => hit._source)),
        })
      )
      .catch((error) => dispatch({ type: 'failure', error }));

    return () => abortController.abort();
  }, [sessionId]);

  return { ...state };
};
