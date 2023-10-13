/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Run } from 'langchain/callbacks';
import { v4 as uuid } from 'uuid';
import { OpenSearchDashboardsRequest, RequestHandlerContext } from '../../../../../src/core/server';
import { IMessage } from '../../../common/types/chat_saved_object_attributes';
import { convertToTraces } from '../../../common/utils/llm_chat/traces';
import { chatAgentInit } from '../../olly/agents/agent_helpers';
import { OpenSearchTracer } from '../../olly/callbacks/opensearch_tracer';
import { requestSuggestionsChain } from '../../olly/chains/suggestions_generator';
import { memoryInit } from '../../olly/memory/chat_agent_memory';
import { LLMModelFactory } from '../../olly/models/llm_model_factory';
import { initTools } from '../../olly/tools/tools_helper';
import { PPLTools } from '../../olly/tools/tool_sets/ppl';
import { buildOutputs } from '../../olly/utils/output_builders/build_outputs';
import { LLMRequestSchema } from '../../routes/chat_routes';
import { PPLGenerationRequestSchema } from '../../routes/langchain_routes';
import { ChatService } from './chat_service';

export class OllyChatService implements ChatService {
  public async requestLLM(
    messages: IMessage[],
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest<unknown, unknown, LLMRequestSchema, 'post'>
  ): Promise<IMessage[]> {
    const { input } = request.body;
    const traceId = uuid();
    const observabilityClient = context.assistant_plugin.observabilityClient.asScoped(request);
    const opensearchClient = context.core.opensearch.client.asCurrentUser;
    const savedObjectsClient = context.core.savedObjects.client;

    try {
      const runs: Run[] = [];
      const callbacks = [new OpenSearchTracer(opensearchClient, traceId, runs)];
      const model = LLMModelFactory.createModel({ client: opensearchClient });
      const embeddings = LLMModelFactory.createEmbeddings({ client: opensearchClient });
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
        traceId,
        suggestions,
        convertToTraces(runs)
      );
    } catch (error) {
      context.assistant_plugin.logger.error(error);
      return [
        {
          type: 'output',
          traceId,
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
    const traceId = uuid();
    const callbacks = [new OpenSearchTracer(opensearchClient, traceId)];
    const model = LLMModelFactory.createModel({ client: opensearchClient });
    const embeddings = LLMModelFactory.createEmbeddings({ client: opensearchClient });
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
