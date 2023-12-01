/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useReducer } from 'react';
import { ASSISTANT_API } from '../../common/constants/llm';
import { useCore } from '../contexts/core_context';
import { genericReducerWithAbortController } from './fetch_reducer';

export const useDeleteSession = () => {
  const core = useCore();
  const [state, dispatch] = useReducer(genericReducerWithAbortController, { loading: false });

  const deleteSession = useCallback(
    (sessionId: string) => {
      const abortController = new AbortController();
      dispatch({ type: 'request', abortController });
      return core.services.http
        .delete(`${ASSISTANT_API.SESSION}/${sessionId}`, {
          signal: abortController.signal,
        })
        .then((payload) => dispatch({ type: 'success', payload }))
        .catch((error) => dispatch({ type: 'failure', error }));
    },
    [core.services.http]
  );

  return {
    ...state,
    deleteSession,
  };
};

export const usePatchSession = () => {
  const core = useCore();
  const [state, dispatch] = useReducer(genericReducerWithAbortController, { loading: false });

  const patchSession = useCallback(
    (sessionId: string, title: string) => {
      const abortController = new AbortController();
      dispatch({ type: 'request', abortController });
      return core.services.http
        .put(`${ASSISTANT_API.SESSION}/${sessionId}`, {
          body: JSON.stringify({
            title,
          }),
          signal: abortController.signal,
        })
        .then((payload) => dispatch({ type: 'success', payload }))
        .catch((error) => dispatch({ type: 'failure', error }));
    },
    [core.services.http]
  );

  return {
    ...state,
    patchSession,
  };
};
