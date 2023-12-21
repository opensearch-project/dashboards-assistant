/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiResponse } from '@opensearch-project/opensearch';
import { RequestHandlerContext } from '../../../../../src/core/server';
import { IMessage, IInput } from '../../../common/types/chat_saved_object_attributes';
import { ChatService } from './chat_service';
import { ML_COMMONS_BASE_API } from '../../utils/constants';

interface AgentRunPayload {
  question?: string;
  verbose?: boolean;
  memory_id?: string;
  regenerate_interaction_id?: string;
}

const MEMORY_ID_FIELD = 'memory_id';
const INTERACTION_ID_FIELD = 'parent_interaction_id';

export class OllyChatService implements ChatService {
  static abortControllers: Map<string, AbortController> = new Map();

  private async requestAgentRun(
    rootAgentId: string,
    payload: AgentRunPayload,
    context: RequestHandlerContext
  ) {
    if (payload.memory_id) {
      OllyChatService.abortControllers.set(payload.memory_id, new AbortController());
    }
    const opensearchClient = context.core.opensearch.client.asCurrentUser;

    try {
      const agentFrameworkResponse = (await opensearchClient.transport.request(
        {
          method: 'POST',
          path: `${ML_COMMONS_BASE_API}/agents/${rootAgentId}/_execute`,
          body: {
            parameters: payload,
          },
        },
        {
          /**
           * It is time-consuming for LLM to generate final answer
           * Give it a large timeout window
           */
          requestTimeout: 5 * 60 * 1000,
          /**
           * Do not retry
           */
          maxRetries: 0,
        }
      )) as ApiResponse<{
        inference_results: Array<{
          output: Array<{ name: string; result?: string }>;
        }>;
      }>;
      const outputBody = agentFrameworkResponse.body.inference_results?.[0]?.output;
      const memoryIdItem = outputBody?.find((item) => item.name === MEMORY_ID_FIELD);
      const interactionIdItem = outputBody?.find((item) => item.name === INTERACTION_ID_FIELD);
      return {
        /**
         * Interactions will be stored in Agent framework,
         * thus we do not need to return the latest message back.
         */
        messages: [],
        memoryId: memoryIdItem?.result || '',
        interactionId: interactionIdItem?.result || '',
      };
    } catch (error) {
      throw error;
    } finally {
      if (payload.memory_id) {
        OllyChatService.abortControllers.delete(payload.memory_id);
      }
    }
  }

  public async requestLLM(
    payload: { messages: IMessage[]; input: IInput; sessionId?: string; rootAgentId: string },
    context: RequestHandlerContext
  ): Promise<{
    messages: IMessage[];
    memoryId: string;
    interactionId: string;
  }> {
    const { input, sessionId, rootAgentId } = payload;

    const parametersPayload: Pick<AgentRunPayload, 'question' | 'verbose' | 'memory_id'> = {
      question: input.content,
      verbose: true,
    };

    if (sessionId) {
      parametersPayload.memory_id = sessionId;
    }

    return await this.requestAgentRun(rootAgentId, parametersPayload, context);
  }

  async regenerate(
    payload: { sessionId: string; interactionId: string; rootAgentId: string },
    context: RequestHandlerContext
  ): Promise<{ messages: IMessage[]; memoryId: string; interactionId: string }> {
    const { sessionId, interactionId, rootAgentId } = payload;
    const parametersPayload: Pick<
      AgentRunPayload,
      'regenerate_interaction_id' | 'verbose' | 'memory_id'
    > = {
      memory_id: sessionId,
      regenerate_interaction_id: interactionId,
      verbose: true,
    };

    return await this.requestAgentRun(rootAgentId, parametersPayload, context);
  }

  abortAgentExecution(sessionId: string) {
    if (OllyChatService.abortControllers.has(sessionId)) {
      OllyChatService.abortControllers.get(sessionId)?.abort();
    }
  }
}
