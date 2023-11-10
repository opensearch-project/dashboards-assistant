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
  metadata: {
    type: 'event_analytics' | 'chat' | 'ppl_submit';
    sessionId?: string;
    traceId?: string;
    error?: boolean;
  };
  input: string;
  output: string;
  correct: boolean | undefined;
  // Currently unused but required.
  expectedOutput: string;
  comment: string;
}

export const useFeedback = () => {
  const chatContext = useChatContext();
  const core = useCore();
  const { chatState } = useChatState();
  const [feedbackResult, setFeedbackResult] = useState<undefined | boolean>(undefined);

  const sendFeedback = async (message: IOutput, correct: boolean) => {
    const outputMessage = message;
    // Markdown type output all has traceId.
    const outputMessageIndex = chatState.messages.findIndex((item) => {
      return item.type === 'output' && item.traceId === message.traceId;
    });
    const inputMessage = chatState.messages
      .slice(0, outputMessageIndex)
      .findLast((item) => item.type === 'input');
    if (!inputMessage) {
      return;
    }

    const body: SendFeedbackBody = {
      metadata: {
        type: 'chat', // currently type is only chat in feedback
        sessionId: chatContext.sessionId,
        traceId: outputMessage.traceId,
        error: false,
      },
      input: inputMessage.content,
      output: outputMessage.content,
      correct,
      expectedOutput: '',
      comment: '',
    };

    try {
      const response = await core.services.http.post(ASSISTANT_API.FEEDBACK, {
        body: JSON.stringify(body),
      });
      setFeedbackResult(correct);
    } catch (error) {
      console.error('send feedback error');
    }
  };

  return { sendFeedback, feedbackResult };
};
