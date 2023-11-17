/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useCallback } from 'react';
import { EuiLink } from '@elastic/eui';
import { NOTEBOOK_API } from '../../common/constants/llm';
import { useCore } from '../contexts/core_context';
import { useChatState } from './use_chat_state';
import { convertMessagesToParagraphs, Paragraphs } from '../utils';
import { getCoreStart } from '../plugin';
import { toMountPoint } from '../../../../src/plugins/opensearch_dashboards_react/public';
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
      try {
        const id = await createNotebook(name);
        const paragraphs = convertMessagesToParagraphs(
          chatState.messages,
          chatContext.currentAccount.username
        );
        await setParagraphs(id, paragraphs);
        const notebookLink = `./observability-notebooks#/${id}?view=view_both`;

        getCoreStart().notifications.toasts.addSuccess({
          text: toMountPoint(
            <>
              <p>
                This conversation was saved as{' '}
                <EuiLink href={notebookLink} target="_blank">
                  {name}
                </EuiLink>
                .
              </p>
            </>
          ),
        });
      } catch (error) {
        if (error.message === 'Not Found') {
          getCoreStart().notifications.toasts.addError(error, {
            title:
              'This feature depends on the observability plugin, please install it before use.',
          });
        } else {
          getCoreStart().notifications.toasts.addError(error, {
            title: 'Failed to save to notebook',
          });
        }
      }
    },
    [chatState, createNotebook, setParagraphs, chatContext]
  );

  return { saveChat };
};
