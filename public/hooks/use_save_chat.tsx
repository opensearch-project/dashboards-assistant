/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { NOTEBOOK_API } from '../../common/constants/llm';
import { useCore } from '../contexts/core_context';
import { useChatState } from './use_chat_state';
import { convertMessagesToParagraphs, Paragraphs } from '../utils';
import { useChatContext } from '../contexts/chat_context';

interface SetParagraphResponse {
  objectId: string;
}

export const useSaveChat = () => {
  const core = useCore();
  const { chatState } = useChatState();
  const chatContext = useChatContext();

  const createNotebook = useCallback(
    async (name: string) => {
      const id = await core.services.http.post<string>(NOTEBOOK_API.CREATE_NOTEBOOK, {
        // do not send abort signal to http client to allow LLM call run in background
        body: JSON.stringify({
          name,
        }),
      });
      if (!id) {
        throw new Error('create notebook error');
      }
      return id;
    },
    [core]
  );

  const setParagraphs = useCallback(
    async (id: string, paragraphs: Paragraphs) => {
      const response = await core.services.http.post<SetParagraphResponse>(
        NOTEBOOK_API.SET_PARAGRAPH,
        {
          // do not send abort signal to http client to allow LLM call run in background
          body: JSON.stringify({
            noteId: id,
            paragraphs,
          }),
        }
      );
      const { objectId } = response;
      if (!objectId) {
        throw new Error('set paragraphs error');
      }
      return objectId;
    },
    [core]
  );

  const saveChat = useCallback(
    async (name: string) => {
      const id = await createNotebook(name);
      const paragraphs = convertMessagesToParagraphs(
        chatState.messages,
        chatContext?.currentAccount?.username
      );
      await setParagraphs(id, paragraphs);
      return id;
    },
    [chatState, createNotebook, setParagraphs, chatContext]
  );

  return { saveChat };
};
