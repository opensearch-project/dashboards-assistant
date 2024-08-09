/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';

import { IOutput, Interaction } from '../../common/types/chat_saved_object_attributes';
import { useCore } from '../contexts/core_context';
import { useChatState } from './use_chat_state';
import { SendFeedbackBody } from '../../common/types/chat_saved_object_attributes';
import { getIncontextInsightRegistry } from '../services';

export const useFeedback = (interaction?: Interaction | null, hasChatState: boolean = true) => {
  const registry = getIncontextInsightRegistry();
  const chatStateContext = useChatState();
  const [feedbackResult, setFeedbackResult] = useState<undefined | boolean>(
    interaction?.additional_info?.feedback?.satisfaction ?? undefined
  );

  const sendFeedback = async (message: IOutput, correct: boolean) => {
    if (hasChatState && chatStateContext?.chatState) {
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

    console.log('use message', message);

    registry.emit('onSendFeedback', { message, body });
    setFeedbackResult(correct);
  };

  return { sendFeedback, feedbackResult };
};
