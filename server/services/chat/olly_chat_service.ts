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

  public async requestLLM(
    payload: { messages: IMessage[]; input: IInput; conversationId?: string; rootAgentId: string },
    context: RequestHandlerContext
  ): Promise<{
    messages: IMessage[];
    memoryId: string;
  }> {
    const { input, conversationId, rootAgentId } = payload;
    const opensearchClient = context.core.opensearch.client.asCurrentUser;

    if (payload.conversationId) {
      OllyChatService.abortControllers.set(payload.conversationId, new AbortController());
    }

    try {
      /**
       * Wait for an API to fetch root agent id.
       */
      const parametersPayload: {
        question: string;
        verbose?: boolean;
        memory_id?: string;
      } = {
        question: input.content,
        verbose: true,
      };
      if (conversationId) {
        parametersPayload.memory_id = conversationId;
      }
      const agentFrameworkResponse = (await opensearchClient.transport.request({
        method: 'POST',
        path: `${ML_COMMONS_BASE_API}/agents/${rootAgentId}/_execute`,
        body: {
          parameters: parametersPayload,
        },
      })) as ApiResponse<{
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
    } catch (error) {
      context.assistant_plugin.logger.error(error);
      return {
        messages: [
          {
            type: 'output',
            traceId: '',
            contentType: 'error',
            content: error.message,
          },
        ],
        memoryId: '',
      };
    } finally {
      if (payload.conversationId) {
        OllyChatService.abortControllers.delete(payload.conversationId);
      }
    }
  }

  abortAgentExecution(conversationId: string) {
    if (OllyChatService.abortControllers.has(conversationId)) {
      OllyChatService.abortControllers.get(conversationId)?.abort();
    }
  }
}
