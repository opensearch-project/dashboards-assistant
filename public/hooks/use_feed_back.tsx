/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ASSISTANT_API } from '../../common/constants/llm';
import {
  IOutput,
  Interaction,
  SendFeedbackBody,
} from '../../common/types/chat_saved_object_attributes';
import { useChatState } from './use_chat_state';
import { HttpSetup } from '../../../../src/core/public';
import { DataSourceService } from '../services/data_source_service';
import { UsageCollectionSetup } from '../../../../src/plugins/usage_collection/public';

export const useFeedback = (
  interaction?: Interaction | null,
  httpSetup?: HttpSetup,
  dataSourceService?: DataSourceService,
  usageCollection?: UsageCollectionSetup,
  metricAppName: string = 'chat'
) => {
  const chatStateContext = useChatState();
  const [feedbackResult, setFeedbackResult] = useState<undefined | boolean>(
    interaction?.additional_info?.feedback?.satisfaction ?? undefined
  );

  const sendFeedback = async (correct: boolean, message: IOutput | null) => {
    if (chatStateContext?.chatState) {
      const chatState = chatStateContext.chatState;
      // Markdown type output all has interactionId. The interactionId of message is equal to interaction id.
      const outputMessageIndex = chatState.messages.findIndex((item) => {
        return item.type === 'output' && item.interactionId === message?.interactionId;
      });
      const inputMessage = chatState.messages
        .slice(0, outputMessageIndex)
        .reverse()
        .find((item) => item.type === 'input');
      if (!inputMessage) {
        return;
      }
    }

    const reportMetric = usageCollection
      ? (metric: string) => {
          usageCollection.reportUiStats(
            metricAppName,
            usageCollection.METRIC_TYPE.CLICK,
            metric + '-' + uuidv4()
          );
        }
      : () => {};

    const body: SendFeedbackBody = {
      satisfaction: correct,
    };
    try {
      if (message) {
        await httpSetup?.put(`${ASSISTANT_API.FEEDBACK}/${message.interactionId}`, {
          body: JSON.stringify(body),
          query: dataSourceService?.getDataSourceQuery(),
        });
      }
      setFeedbackResult(correct);
      reportMetric(correct ? 'thumbup' : 'thumbdown');
    } catch (error) {
      console.error('send feedback error', error);
    }
  };

  return { sendFeedback, feedbackResult };
};
