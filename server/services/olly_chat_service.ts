/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Run } from 'langchain/callbacks';
import { v4 as uuid } from 'uuid';
import { OpenSearchDashboardsRequest, RequestHandlerContext } from '../../../../src/core/server';
import { IMessage } from '../../common/types/chat_saved_object_attributes';
import { convertToTraces } from '../../common/utils/llm_chat/traces';
import { chatAgentInit } from '../olly/agents/agent_helpers';
import { OpenSearchTracer } from '../olly/callbacks/opensearch_tracer';
import { requestSuggestionsChain } from '../olly/chains/suggestions_generator';
import { memoryInit } from '../olly/memory/chat_agent_memory';
import { LLMModelFactory } from '../olly/models/llm_model_factory';
import { PPLTools } from '../olly/tools/tool_sets/ppl';
import { initTools } from '../olly/tools/tools_helper';
import { buildOutputs } from '../olly/utils/output_builders/build_outputs';
import { LLMRequestSchema } from '../routes/chat_routes';
import { PPLGenerationRequestSchema } from '../routes/langchain_routes';
import { ChatService } from './chat_service';
import { StorageService } from './storage_service';

export class OllyChatService implements ChatService {
  public async requestLLM(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest<unknown, unknown, LLMRequestSchema, 'post'>,
    storageService: StorageService
  ): Promise<IMessage[]> {
    const { chatId, input, messages = [] } = request.body;
    const sessionId = uuid();
    const observabilityClient = context.assistant_plugin.observabilityClient.asScoped(request);
    const opensearchClient = context.core.opensearch.client.asCurrentUser;
    const savedObjectsClient = context.core.savedObjects.client;

    // get history from the chat object for existing chats
    if (chatId && messages.length === 0) {
      try {
        const savedMessages = await storageService.getMessages(chatId);
        messages.push(...savedMessages);
      } catch (error) {
        throw new Error(`failed to get history for ${chatId}: ` + error);
      }
    }

    try {
      const runs: Run[] = [];
      const callbacks = [new OpenSearchTracer(opensearchClient, sessionId, runs)];
      const model = LLMModelFactory.createModel({ client: opensearchClient });
      const embeddings = LLMModelFactory.createEmbeddings();
      const pluginTools = initTools(
        model,
        embeddings,
        opensearchClient,
        observabilityClient,
        savedObjectsClient,
        callbacks
      );
      const memory = memoryInit(messages);
      const chatAgent = chatAgentInit(
        model,
        pluginTools.flatMap((tool) => tool.toolsList),
        callbacks,
        memory
      );
      const agentResponse = await chatAgent.run(input.content);

      const suggestions = await requestSuggestionsChain(
        model,
        pluginTools.flatMap((tool) => tool.toolsList),
        memory,
        callbacks
      );

      return buildOutputs(
        input.content,
        agentResponse,
        sessionId,
        suggestions,
        convertToTraces(runs)
      );
    } catch (error) {
      context.assistant_plugin.logger.error(error);
      return [
        {
          type: 'output',
          sessionId,
          contentType: 'error',
          content: error.message,
        },
      ];
    }
  }

  generatePPL(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest<unknown, unknown, PPLGenerationRequestSchema, 'post'>
  ): Promise<string> {
    const { index, question } = request.body;
    const observabilityClient = context.assistant_plugin.observabilityClient.asScoped(request);
    const opensearchClient = context.core.opensearch.client.asCurrentUser;
    const savedObjectsClient = context.core.savedObjects.client;
    const sessionId = uuid();
    const callbacks = [new OpenSearchTracer(opensearchClient, sessionId)];
    const model = LLMModelFactory.createModel({ client: opensearchClient });
    const embeddings = LLMModelFactory.createEmbeddings();
    const pplTools = new PPLTools(
      model,
      embeddings,
      opensearchClient,
      observabilityClient,
      savedObjectsClient,
      callbacks
    );
    return pplTools.generatePPL(question, index);
  }
}
