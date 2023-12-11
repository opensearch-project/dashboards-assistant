/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiResponse } from '@opensearch-project/opensearch';
import { RequestHandlerContext } from '../../../../../src/core/server';
import { IMessage, IInput } from '../../../common/types/chat_saved_object_attributes';
import { ChatService } from './chat_service';
import { ML_COMMONS_BASE_API } from '../../utils/constants';

const MEMORY_ID_FIELD = 'memory_id';

export class OllyChatService implements ChatService {
  static abortControllers: Map<string, AbortController> = new Map();

  private async requestAgentRun(
    rootAgentId: string,
    payload: {
      question?: string;
      verbose?: boolean;
      memory_id?: string;
      regenerate_interaction_id?: string;
    },
    context: RequestHandlerContext
  ) {
    const opensearchClient = context.core.opensearch.client.asCurrentUser;
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

    return {
      /**
       * Interactions will be stored in Agent framework,
       * thus we do not need to return the latest message back.
       */
      messages: [],
      memoryId: memoryIdItem?.result || '',
    };
  }

  public async requestLLM(
    payload: { messages: IMessage[]; input: IInput; sessionId?: string; rootAgentId: string },
    context: RequestHandlerContext
  ): Promise<{
    messages: IMessage[];
    memoryId: string;
  }> {
    const { input, sessionId, rootAgentId } = payload;
    if (payload.sessionId) {
      OllyChatService.abortControllers.set(payload.sessionId, new AbortController());
    }

    const parametersPayload: {
      question?: string;
      verbose?: boolean;
      memory_id?: string;
    } = {
      question: input.content,
      verbose: true,
    };

    if (sessionId) {
      parametersPayload.memory_id = sessionId;
    }

    try {
      return await this.requestAgentRun(rootAgentId, parametersPayload, context);
    } catch (error) {
      throw error;
    } finally {
      if (payload.sessionId) {
        OllyChatService.abortControllers.delete(payload.sessionId);
      }
    }
  }

  async regenerate(
    payload: { sessionId: string; interactionId: string; rootAgentId: string },
    context: RequestHandlerContext
  ): Promise<{ messages: IMessage[]; memoryId: string }> {
    const { sessionId, interactionId, rootAgentId } = payload;
    const parametersPayload: {
      verbose?: boolean;
      memory_id?: string;
      regenerate_interaction_id?: string;
    } = {
      memory_id: sessionId,
      regenerate_interaction_id: interactionId,
      verbose: true,
    };

    OllyChatService.abortControllers.set(sessionId, new AbortController());

    try {
      return await this.requestAgentRun(rootAgentId, parametersPayload, context);
    } catch (error) {
      throw error;
    } finally {
      if (payload.sessionId) {
        OllyChatService.abortControllers.delete(payload.sessionId);
      }
    }
  }

  abortAgentExecution(sessionId: string) {
    if (OllyChatService.abortControllers.has(sessionId)) {
      OllyChatService.abortControllers.get(sessionId)?.abort();
    }
  }
}
