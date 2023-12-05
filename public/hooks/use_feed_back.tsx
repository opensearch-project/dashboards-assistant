/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ASSISTANT_API } from '../../common/constants/llm';
import { IOutput } from '../../common/types/chat_saved_object_attributes';
import { useChatContext } from '../contexts/chat_context';
import { useCore } from '../contexts/core_context';
import { useChatState } from './use_chat_state';

interface SendFeedbackBody {
  satisfaction: boolean;
}

export const useFeedback = () => {
  const chatContext = useChatContext();
  const core = useCore();
  const { chatState } = useChatState();
  const [feedbackResult, setFeedbackResult] = useState<undefined | boolean>(undefined);

  const sendFeedback = async (message: IOutput, correct: boolean) => {
    const outputMessage = message;
    // Markdown type output all has interactionId.
    const outputMessageIndex = chatState.messages.findIndex((item) => {
      return item.type === 'output' && item.interactionId === message.interactionId;
    });
    const inputMessage = chatState.messages
      .slice(0, outputMessageIndex)
      .findLast((item) => item.type === 'input');
    if (!inputMessage) {
      return;
    }

    const body: SendFeedbackBody = {
      satisfaction: correct,
    };

    try {
      await core.services.http.put(`${ASSISTANT_API.FEEDBACK}/${message.interactionId}`, {
        body: JSON.stringify(body),
      });
      setFeedbackResult(correct);
    } catch (error) {
      console.error('send feedback error');
    }
  };

  return { sendFeedback, feedbackResult };
};
