/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiResponse } from '@opensearch-project/opensearch';
import { RequestHandlerContext } from '../../../../../src/core/server';
import { IMessage, IInput } from '../../../common/types/chat_saved_object_attributes';
import { ChatService } from './chat_service';
import {
  ML_COMMONS_BASE_API,
  RESOURCE_NOT_FOUND_STATUS_CODE,
  RESOURCE_NOT_FOUND_ERROR,
} from '../../utils/constants';

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
  private static rootAgentId: string | undefined;

  constructor(
    private readonly context: RequestHandlerContext,
    private readonly rootAgentName: string
  ) {}

  private async initRootAgent() {
    OllyChatService.rootAgentId = await this.searchRootAgent(this.rootAgentName);
  }

  private async searchRootAgent(rootAgentName: string): Promise<string> {
    try {
      const requestParams = {
        query: {
          term: {
            'name.keyword': rootAgentName,
          },
        },
        sort: {
          created_time: 'desc',
        },
      };

      const opensearchClient = this.context.core.opensearch.client.asCurrentUser;
      const response = await opensearchClient.transport.request({
        method: 'GET',
        path: `${ML_COMMONS_BASE_API}/agents/_search`,
        body: requestParams,
      });

      if (!response || response.body.hits.total.value === 0) {
        throw new Error('cannot find any root agent by name: ' + rootAgentName);
      }
      return response.body.hits.hits[0]._id;
    } catch (error) {
      const errorMessage = JSON.stringify(error.meta?.body) || error;
      throw new Error('search root agent failed, reason: ' + errorMessage);
    }
  }

  private async requestAgentRun(payload: AgentRunPayload) {
    if (payload.memory_id) {
      OllyChatService.abortControllers.set(payload.memory_id, new AbortController());
    }

    // if rootAgentId has not been initialized yet, init rootAgentId firstly
    if (!OllyChatService.rootAgentId) {
      await this.initRootAgent();
      this.context.assistant_plugin.logger.info(
        `root agent id has not been initialized yet, init it at the first time, current root agent id is:${OllyChatService.rootAgentId}`
      );
    }

    try {
      return await this.callExecuteAgentAPI(payload);
    } catch (error) {
      if (
        error.meta?.statusCode === RESOURCE_NOT_FOUND_STATUS_CODE &&
        error.body.error.type === RESOURCE_NOT_FOUND_ERROR
      ) {
        const oldRootAgentId = OllyChatService.rootAgentId;
        await this.initRootAgent();
        this.context.assistant_plugin.logger.info(
          `cannot find the root agent id: ${oldRootAgentId}, try to fetch the new root agent id, now it is:${OllyChatService.rootAgentId}`
        );
        return await this.callExecuteAgentAPI(payload);
      } else {
        throw error;
      }
    }
  }

  private async callExecuteAgentAPI(payload: AgentRunPayload) {
    const opensearchClient = this.context.core.opensearch.client.asCurrentUser;
    try {
      const agentFrameworkResponse = (await opensearchClient.transport.request(
        {
          method: 'POST',
          path: `${ML_COMMONS_BASE_API}/agents/${OllyChatService.rootAgentId}/_execute`,
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

  async requestLLM(payload: {
    messages: IMessage[];
    input: IInput;
    conversationId?: string;
  }): Promise<{
    messages: IMessage[];
    memoryId: string;
    interactionId: string;
  }> {
    const { input, conversationId } = payload;

    const parametersPayload: Pick<AgentRunPayload, 'question' | 'verbose' | 'memory_id'> = {
      question: input.content,
      verbose: true,
    };

    if (conversationId) {
      parametersPayload.memory_id = conversationId;
    }

    return await this.requestAgentRun(parametersPayload);
  }

  async regenerate(payload: {
    conversationId: string;
    interactionId: string;
  }): Promise<{ messages: IMessage[]; memoryId: string; interactionId: string }> {
    const { conversationId, interactionId } = payload;
    const parametersPayload: Pick<
      AgentRunPayload,
      'regenerate_interaction_id' | 'verbose' | 'memory_id'
    > = {
      memory_id: conversationId,
      regenerate_interaction_id: interactionId,
      verbose: true,
    };

    return await this.requestAgentRun(parametersPayload);
  }

  abortAgentExecution(conversationId: string) {
    if (OllyChatService.abortControllers.has(conversationId)) {
      OllyChatService.abortControllers.get(conversationId)?.abort();
    }
  }

  // only used for test
  resetRootAgentId() {
    OllyChatService.rootAgentId = undefined;
  }
}
