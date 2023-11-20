/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useReducer, useState } from 'react';
import { HttpFetchQuery, SavedObjectsFindOptions } from '../../../../src/core/public';
import { ASSISTANT_API } from '../../common/constants/llm';
import { ISessionFindResponse } from '../../common/types/chat_saved_object_attributes';
import { useCore } from '../contexts/core_context';
import { GenericReducer, genericReducer, genericReducerWithAbortController } from './fetch_reducer';

export const useGetSessions = (options: Partial<SavedObjectsFindOptions> = {}) => {
  const core = useCore();
  const reducer: GenericReducer<ISessionFindResponse> = genericReducer;
  const [state, dispatch] = useReducer(reducer, { loading: false });
  const [refresh, setRefresh] = useState({});

  useEffect(() => {
    const abortController = new AbortController();
    dispatch({ type: 'request' });

    core.services.http
      .get<ISessionFindResponse>(ASSISTANT_API.SESSIONS, {
        query: options as HttpFetchQuery,
        signal: abortController.signal,
      })
      .then((payload) => dispatch({ type: 'success', payload }))
      .catch((error) => dispatch({ type: 'failure', error }));

    return () => {
      abortController.abort();
    };
  }, [options, refresh]);

  return { ...state, refresh: () => setRefresh({}) };
};

export const useDeleteSession = () => {
  const core = useCore();
  const [state, dispatch] = useReducer(genericReducerWithAbortController, { loading: false });

  const deleteSession = useCallback((sessionId: string) => {
    const abortController = new AbortController();
    dispatch({ type: 'request', abortController });
    return core.services.http
      .delete(`${ASSISTANT_API.SESSION}/${sessionId}`, {
        signal: abortController.signal,
      })
      .then((payload) => dispatch({ type: 'success', payload }))
      .catch((error) => dispatch({ type: 'failure', error }));
  }, []);

  return {
    ...state,
    deleteSession,
  };
};

export const usePatchSession = () => {
  const core = useCore();
  const [state, dispatch] = useReducer(genericReducerWithAbortController, { loading: false });

  const patchSession = useCallback((sessionId: string, title: string) => {
    const abortController = new AbortController();
    dispatch({ type: 'request', abortController });
    return core.services.http
      .put(`${ASSISTANT_API.SESSION}/${sessionId}`, {
        query: {
          title,
        },
        signal: abortController.signal,
      })
      .then((payload) => dispatch({ type: 'success', payload }))
      .catch((error) => dispatch({ type: 'failure', error }));
  }, []);

  return {
    ...state,
    patchSession,
  };
};
