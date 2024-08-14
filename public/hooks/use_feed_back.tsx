/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ASSISTANT_API } from '../../common/constants/llm';
import {
  IOutput,
  Interaction,
  SendFeedbackBody,
} from '../../common/types/chat_saved_object_attributes';
import { useChatState } from './use_chat_state';
import { HttpSetup } from '../../../../src/core/public';
import { DataSourceService } from '../services/data_source_service';

export const useFeedback = (
  interaction?: Interaction | null,
  httpSetup?: HttpSetup,
  dataSourceService?: DataSourceService
) => {
  const chatStateContext = useChatState();
  const [feedbackResult, setFeedbackResult] = useState<undefined | boolean>(
    interaction?.additional_info?.feedback?.satisfaction ?? undefined
  );

  const sendFeedback = async (message: IOutput, correct: boolean) => {
    if (chatStateContext?.chatState) {
      const chatState = chatStateContext.chatState;
      // Markdown type output all has interactionId. The interactionId of message is equal to interaction id.
      const outputMessageIndex = chatState.messages.findIndex((item) => {
        return item.type === 'output' && item.interactionId === message.interactionId;
      });
      const inputMessage = chatState.messages
        .slice(0, outputMessageIndex)
        .reverse()
        .find((item) => item.type === 'input');
      if (!inputMessage) {
        return;
      }
    }

    const body: SendFeedbackBody = {
      satisfaction: correct,
    };
    try {
      await httpSetup?.put(`${ASSISTANT_API.FEEDBACK}/${message.interactionId}`, {
        body: JSON.stringify(body),
        query: dataSourceService?.getDataSourceQuery(),
      });
      setFeedbackResult(correct);
    } catch (error) {
      console.error('send feedback error', error);
    }
  };

  return { sendFeedback, feedbackResult };
};
