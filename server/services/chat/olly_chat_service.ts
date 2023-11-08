/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Run } from 'langchain/callbacks';
import { v4 as uuid } from 'uuid';
import { ApiResponse } from '@opensearch-project/opensearch';
import { OpenSearchDashboardsRequest, RequestHandlerContext } from '../../../../../src/core/server';
import { IMessage, IInput } from '../../../common/types/chat_saved_object_attributes';
import { convertToTraces } from '../../../common/utils/llm_chat/traces';
import { chatAgentInit } from '../../olly/agents/agent_helpers';
import { OpenSearchTracer } from '../../olly/callbacks/opensearch_tracer';
import { requestSuggestionsChain } from '../../olly/chains/suggestions_generator';
import { memoryInit } from '../../olly/memory/chat_agent_memory';
import { LLMModelFactory } from '../../olly/models/llm_model_factory';
import { initTools } from '../../olly/tools/tools_helper';
import { PPLTools } from '../../olly/tools/tool_sets/ppl';
import { buildOutputs } from '../../olly/utils/output_builders/build_outputs';
import { AbortAgentExecutionSchema, LLMRequestSchema } from '../../routes/chat_routes';
import { PPLGenerationRequestSchema } from '../../routes/langchain_routes';
import { ChatService } from './chat_service';

export class OllyChatService implements ChatService {
  static abortControllers: Map<string, AbortController> = new Map();

  public async requestLLM(
    payload: { messages: IMessage[]; input: IInput; sessionId?: string },
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest
  ): Promise<IMessage[]> {
    const traceId = uuid();
    const observabilityClient = context.assistant_plugin.observabilityClient.asScoped(request);
    const opensearchClient = context.core.opensearch.client.asCurrentUser;
    const savedObjectsClient = context.core.savedObjects.client;

    if (payload.sessionId) {
      OllyChatService.abortControllers.set(payload.sessionId, new AbortController());
    }

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
      const memory = memoryInit(payload.messages);

      /**
       * Wait for an API to fetch root agent id.
       */
      const agentFrameworkResponse = (await opensearchClient.transport.request({
        method: 'POST',
        path: '/_plugins/_ml/agents/_UoprosBZFp32K9Rsfqe/_execute',
        body: {
          parameters: {
            question: payload.input.content,
          },
        },
      })) as ApiResponse<{
        inference_results: Array<{
          output: Array<{ name: string; result?: string; dataAsMap?: { response: string } }>;
        }>;
      }>;
      const outputBody = agentFrameworkResponse.body.inference_results?.[0]?.output?.[0];
      const agentFrameworkAnswer =
        agentFrameworkResponse.body.inference_results[0].output[0].result || "";
      await memory.chatHistory.addUserMessage(payload.input.content);
      await memory.chatHistory.addAIChatMessage(agentFrameworkAnswer);

      const suggestions = await requestSuggestionsChain(
        model,
        pluginTools.flatMap((tool) => tool.toolsList),
        memory,
        callbacks
      );

      return buildOutputs(
        payload.input.content,
        agentFrameworkAnswer,
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
