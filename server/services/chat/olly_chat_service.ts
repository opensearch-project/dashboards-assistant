/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiResponse } from '@opensearch-project/opensearch';
import { OpenSearchClient } from '../../../../../src/core/server';
import { IMessage, IInput } from '../../../common/types/chat_saved_object_attributes';
import { ChatService } from './chat_service';
import { ML_COMMONS_BASE_API, ROOT_AGENT_CONFIG_ID } from '../../utils/constants';
import { getAgent, getAgentDetail } from '../../routes/get_agent';
import { AgentRoles } from '../../../server/types';

interface AgentRunPayload {
  question?: string;
  verbose?: boolean;
  memory_id?: string;
  regenerate_interaction_id?: string;
  'prompt.prefix'?: string;
  agentRole?: string;
  context?: string;
  index?: string;
}

const MEMORY_ID_FIELD = 'memory_id';
const INTERACTION_ID_FIELD = 'parent_interaction_id';

export class OllyChatService implements ChatService {
  static abortControllers: Map<string, AbortController> = new Map();

  constructor(private readonly opensearchClientTransport: OpenSearchClient['transport']) {}

  private async getRootAgent(): Promise<string> {
    return await getAgent(ROOT_AGENT_CONFIG_ID, this.opensearchClientTransport);
  }

  /**
   * @param conversationId conversation/memory Id
   * @returns additional information associated with the conversation/memory
   */
  private async getAdditionalInfoForConversation(
    conversationId: string
  ): Promise<Record<string, string> | undefined> {
    try {
      const response = await this.opensearchClientTransport.request({
        method: 'GET',
        path: `${ML_COMMONS_BASE_API}/memory/${conversationId}`,
      });

      return response?.body?.additional_info;
    } catch (error) {
      return undefined;
    }
  }

  private async createNewConversation(
    title?: string,
    applicationType?: string,
    additionalInfo?: Record<string, string>
  ): Promise<string | undefined> {
    try {
      const response = (await this.opensearchClientTransport.request({
        method: 'POST',
        path: `${ML_COMMONS_BASE_API}/memory`,
        body: {
          name: title,
          application_type: applicationType,
          additional_info: {
            ...additionalInfo,
          },
        },
      })) as ApiResponse<{
        memory_id: string;
      }>;

      return response.body.memory_id;
    } catch (error) {
      return undefined;
    }
  }

  private async requestAgentRun(payload: AgentRunPayload) {
    if (payload.memory_id) {
      OllyChatService.abortControllers.set(payload.memory_id, new AbortController());
    }

    let memoryId = payload.memory_id;
    let agentConfigId = ROOT_AGENT_CONFIG_ID;
    let agentId;
    let promptPrefix;

    // follow up questions
    if (memoryId) {
      const additionalInfo = await this.getAdditionalInfoForConversation(memoryId);
      if (additionalInfo) {
        agentConfigId = additionalInfo.agent_config_id;
        payload.agentRole = payload.agentRole || additionalInfo.agentRole;
        payload.context = additionalInfo.context;
        payload.index = additionalInfo.index;
      }
    }

    if (payload.agentRole) {
      const agentRole = AgentRoles.find((role) => role.id === payload.agentRole);
      if (agentRole) {
        agentConfigId = agentRole?.agentConfigId;
        promptPrefix = agentRole.description;

        if (promptPrefix && promptPrefix.length) {
          payload['prompt.prefix'] = promptPrefix;
        }

        agentId = await getAgent(agentConfigId, this.opensearchClientTransport);

        // start with a new conversation
        if (!memoryId) {
          const agentDetail = await getAgentDetail(agentId, this.opensearchClientTransport);

          memoryId = await this.createNewConversation(payload.question, agentDetail.app_type, {
            agent_config_id: agentRole?.agentConfigId || ROOT_AGENT_CONFIG_ID,
            ...(agentRole ? { agentRole: agentRole.id } : {}),
            ...(payload.context ? { context: payload.context } : {}),
            ...(payload.index ? { index: payload.index } : {}),
          });
          // set memory id
          payload.memory_id = memoryId;
        }
      }
    }

    if (!agentId) {
      agentId = await getAgent(
        agentConfigId || ROOT_AGENT_CONFIG_ID,
        this.opensearchClientTransport
      );
    }

    return await this.callExecuteAgentAPI(payload, agentId);
  }

  private async callExecuteAgentAPI(payload: AgentRunPayload, agentId: string) {
    try {
      const agentFrameworkResponse = (await this.opensearchClientTransport.request(
        {
          method: 'POST',
          path: `${ML_COMMONS_BASE_API}/agents/${agentId}/_execute`,
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
    const { input } = payload;

    const parametersPayload: AgentRunPayload = {
      question: input.content,
      context: input.context?.content,
      verbose: false,
      agentRole: input.context?.agentRole,
      memory_id: payload.conversationId,
      index: input.context?.index,
    };

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
