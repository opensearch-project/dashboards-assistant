/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useReducer } from 'react';
import { ASSISTANT_API } from '../../common/constants/llm';
import { AgentFrameworkTrace } from '../../common/utils/llm_chat/traces';
import { useCore } from '../contexts/core_context';
import { GenericReducer, genericReducer } from './fetch_reducer';

export const useFetchAgentFrameworkTraces = (traceId: string) => {
  const core = useCore();
  const reducer: GenericReducer<AgentFrameworkTrace[]> = genericReducer;
  const [state, dispatch] = useReducer(reducer, { loading: false });

  useEffect(() => {
    const abortController = new AbortController();
    dispatch({ type: 'request' });
    if (!traceId) {
      dispatch({ type: 'success', payload: undefined });
      return;
    }

    core.services.http
      .get<AgentFrameworkTrace[]>(`${ASSISTANT_API.TRACE}/${traceId}`)
      .then((payload) =>
        dispatch({
          type: 'success',
          payload,
        })
      )
      .catch((error) => dispatch({ type: 'failure', error }));

    return () => abortController.abort();
  }, [traceId]);

  return { ...state };
};
