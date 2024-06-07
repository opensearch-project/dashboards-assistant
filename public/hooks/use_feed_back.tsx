/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ASSISTANT_API } from '../../common/constants/llm';
import { IOutput, Interaction } from '../../common/types/chat_saved_object_attributes';
import { useCore } from '../contexts/core_context';
import { useChatState } from './use_chat_state';
import { SendFeedbackBody } from '../../common/types/chat_saved_object_attributes';

export const useFeedback = (interaction?: Interaction | null) => {
  const core = useCore();
  const { chatState } = useChatState();
  const [feedbackResult, setFeedbackResult] = useState<undefined | boolean>(
    interaction?.additional_info?.feedback?.satisfaction ?? undefined
  );

  const sendFeedback = async (message: IOutput, correct: boolean) => {
    const outputMessage = message;
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

    const body: SendFeedbackBody = {
      satisfaction: correct,
    };

    try {
      await core.services.http.put(`${ASSISTANT_API.FEEDBACK}/${message.interactionId}`, {
        body: JSON.stringify(body),
        query: core.services.dataSource.getDataSourceQuery(),
      });
      setFeedbackResult(correct);
    } catch (error) {
      console.log('send feedback error');
    }
  };

  return { sendFeedback, feedbackResult };
};
