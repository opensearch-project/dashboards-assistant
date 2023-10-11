/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useReducer, useState } from 'react';
import { HttpFetchQuery, SavedObjectsFindOptions } from '../../../../src/core/public';
import { ASSISTANT_API } from '../../common/constants/llm';
import { ISession, ISessionFindResponse } from '../../common/types/chat_saved_object_attributes';
import { useChatContext } from '../contexts/chat_context';
import { useCore } from '../contexts/core_context';
import { GenericReducer, genericReducer } from './fetch_reducer';

export const useGetSession = () => {
  const chatContext = useChatContext();
  const core = useCore();
  const reducer: GenericReducer<ISession> = genericReducer;
  const [state, dispatch] = useReducer(reducer, { loading: false });

  useEffect(() => {
    const abortController = new AbortController();
    dispatch({ type: 'request' });
    if (!chatContext.sessionID) {
      dispatch({ type: 'success', payload: undefined });
      return;
    }

    core.services.http
      .get<ISession>(`${ASSISTANT_API.SESSION}/${chatContext.sessionID}`, {
        signal: abortController.signal,
      })
      .then((payload) => dispatch({ type: 'success', payload }))
      .catch((error) => dispatch({ type: 'failure', error }));

    return () => {
      abortController.abort();
    };
  }, [chatContext.sessionID]);

  return { ...state };
};

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
