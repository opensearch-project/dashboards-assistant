/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiResponse } from '@opensearch-project/opensearch';
import { OpenSearchClient } from '../../../../../src/core/server';
import { IMessage, IInput } from '../../../common/types/chat_saved_object_attributes';
import { ChatService } from './chat_service';
import { ML_COMMONS_BASE_API, ROOT_AGENT_CONFIG_ID } from '../../utils/constants';

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

  constructor(private readonly opensearchClientTransport: OpenSearchClient['transport']) {}

  private async getRootAgent(): Promise<string> {
    try {
      const path = `${ML_COMMONS_BASE_API}/config/${ROOT_AGENT_CONFIG_ID}`;
      const response = await this.opensearchClientTransport.request({
        method: 'GET',
        path,
      });

      if (!response || !response.body.configuration?.agent_id) {
        throw new Error(`cannot get root agent by calling the api: ${path}`);
      }
      return response.body.configuration.agent_id;
    } catch (error) {
      const errorMessage = JSON.stringify(error.meta?.body) || error;
      throw new Error('get root agent failed, reason: ' + errorMessage);
    }
  }

  private async requestAgentRun(payload: AgentRunPayload) {
    if (payload.memory_id) {
      OllyChatService.abortControllers.set(payload.memory_id, new AbortController());
    }

    const rootAgentId = await this.getRootAgent();
    return await this.callExecuteAgentAPI(payload, rootAgentId);
  }

  private async callExecuteAgentAPI(payload: AgentRunPayload, rootAgentId: string) {
    try {
      const agentFrameworkResponse = (await this.opensearchClientTransport.request(
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
      const conversationIdItem = outputBody?.find((item) => item.name === MEMORY_ID_FIELD);
      const interactionIdItem = outputBody?.find((item) => item.name === INTERACTION_ID_FIELD);
      return {
        /**
         * Interactions will be stored in Agent framework,
         * thus we do not need to return the latest message back.
         */
        messages: [],
        conversationId: conversationIdItem?.result || '',
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
    conversationId: string;
    interactionId: string;
  }> {
    const { input, conversationId } = payload;

    const parametersPayload: Pick<AgentRunPayload, 'question' | 'verbose' | 'memory_id'> = {
      question: input.content,
      verbose: false,
    };

    if (conversationId) {
      parametersPayload.memory_id = conversationId;
    }

    return await this.requestAgentRun(parametersPayload);
  }

  async regenerate(payload: {
    conversationId: string;
    interactionId: string;
  }): Promise<{ messages: IMessage[]; conversationId: string; interactionId: string }> {
    const { conversationId, interactionId } = payload;
    const parametersPayload: Pick<
      AgentRunPayload,
      'regenerate_interaction_id' | 'verbose' | 'memory_id'
    > = {
      memory_id: conversationId,
      regenerate_interaction_id: interactionId,
      verbose: false,
    };

    return await this.requestAgentRun(parametersPayload);
  }

  abortAgentExecution(conversationId: string) {
    if (OllyChatService.abortControllers.has(conversationId)) {
      OllyChatService.abortControllers.get(conversationId)?.abort();
    }
  }
}
