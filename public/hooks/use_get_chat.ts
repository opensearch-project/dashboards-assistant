/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useReducer, useState } from 'react';
import {
  HttpFetchQuery,
  SavedObjectsFindOptions,
  SimpleSavedObject,
} from '../../../../src/core/public';
import { SavedObjectsFindResponse } from '../../../../src/core/server';
import { ASSISTANT_API } from '../../common/constants/llm';
import { CHAT_SAVED_OBJECT, IChat } from '../../common/types/chat_saved_object_attributes';
import { useChatContext } from '../contexts/chat_context';
import { useCore } from '../contexts/core_context';
import { GenericReducer, genericReducer } from './fetch_reducer';

export const useGetChat = () => {
  const chatContext = useChatContext();
  const core = useCore();
  const reducer: GenericReducer<SimpleSavedObject<IChat>> = genericReducer;
  const [state, dispatch] = useReducer(reducer, { loading: false });

  useEffect(() => {
    // savedObjectsClient does not support abort signal
    let abort = false;
    dispatch({ type: 'request' });
    if (!chatContext.chatId) {
      dispatch({ type: 'success', payload: undefined });
      return;
    }

    core.services.savedObjects.client
      .get<IChat>(CHAT_SAVED_OBJECT, chatContext.chatId)
      .then((payload) => {
        if (!abort) dispatch({ type: 'success', payload });
      })
      .catch((error) => {
        if (!abort) dispatch({ type: 'failure', error });
      });

    return () => {
      abort = true;
    };
  }, [chatContext.chatId]);

  return { ...state };
};

export const useBulkGetChat = (options: Partial<SavedObjectsFindOptions> = {}) => {
  const core = useCore();
  const reducer: GenericReducer<SavedObjectsFindResponse<IChat>> = genericReducer;
  const [state, dispatch] = useReducer(reducer, { loading: false });
  const [refresh, setRefresh] = useState({});

  useEffect(() => {
    const abortController = new AbortController();
    dispatch({ type: 'request' });

    core.services.http
      .get<SavedObjectsFindResponse<IChat>>(ASSISTANT_API.HISTORY, {
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
