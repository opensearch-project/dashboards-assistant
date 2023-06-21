/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext, useEffect, useReducer } from 'react';
import {
  SavedObjectsFindOptions,
  SavedObjectsFindResponsePublic,
  SimpleSavedObject,
} from '../../../../../../src/core/public';
import {
  CHAT_SAVED_OBJECT,
  IChat,
} from '../../../../common/types/observability_saved_object_attributes';
import { ChatContext, CoreServicesContext } from '../chat_header_button';
import { genericReducer, GenericReducer } from './fetch_reducer';

export const useGetChat = () => {
  const chatContext = useContext(ChatContext)!;
  const coreServicesContext = useContext(CoreServicesContext)!;
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

    coreServicesContext.savedObjectsClient
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
  const chatContext = useContext(CoreServicesContext)!;
  const reducer: GenericReducer<SavedObjectsFindResponsePublic<IChat>> = genericReducer;
  const [state, dispatch] = useReducer(reducer, { loading: false });

  useEffect(() => {
    // savedObjectsClient does not support abort signal
    let abort = false;
    dispatch({ type: 'request' });

    // TODO move find call to server, because public saved object client does not support sorting
    chatContext.savedObjectsClient
      .find<IChat>({ ...options, type: CHAT_SAVED_OBJECT })
      .then((payload) => {
        if (!abort) dispatch({ type: 'success', payload });
      })
      .catch((error) => {
        if (!abort) dispatch({ type: 'failure', error });
      });

    return () => {
      abort = true;
    };
  }, [options]);

  return { ...state };
};
