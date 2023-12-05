/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useReducer, useRef } from 'react';
import { ASSISTANT_API } from '../../common/constants/llm';
import { useCore } from '../contexts/core_context';
import { genericReducer } from './fetch_reducer';

export const useDeleteConversation = () => {
  const core = useCore();
  const [state, dispatch] = useReducer(genericReducer, { loading: false });
  const abortControllerRef = useRef<AbortController>();

  const deleteConversation = useCallback(
    (conversationId: string) => {
      abortControllerRef.current = new AbortController();
      dispatch({ type: 'request' });
      return core.services.http
        .delete(`${ASSISTANT_API.CONVERSATION}/${conversationId}`, {
          signal: abortControllerRef.current.signal,
        })
        .then((payload) => dispatch({ type: 'success', payload }))
        .catch((error) => dispatch({ type: 'failure', error }));
    },
    [core.services.http]
  );

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    ...state,
    abort,
    deleteConversation,
  };
};

export const usePatchConversation = () => {
  const core = useCore();
  const [state, dispatch] = useReducer(genericReducer, { loading: false });
  const abortControllerRef = useRef<AbortController>();

  const patchConversation = useCallback(
    (conversationId: string, title: string) => {
      abortControllerRef.current = new AbortController();
      dispatch({ type: 'request' });
      return core.services.http
        .put(`${ASSISTANT_API.CONVERSATION}/${conversationId}`, {
          body: JSON.stringify({
            title,
          }),
          signal: abortControllerRef.current.signal,
        })
        .then((payload) => dispatch({ type: 'success', payload }))
        .catch((error) => dispatch({ type: 'failure', error }));
    },
    [core.services.http]
  );

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    ...state,
    abort,
    patchConversation,
  };
};
