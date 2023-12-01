/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { v4 as uuid } from 'uuid';
import { ApiResponse } from '@opensearch-project/opensearch';
import { OpenSearchDashboardsRequest, RequestHandlerContext } from '../../../../../src/core/server';
import { IMessage, IInput } from '../../../common/types/chat_saved_object_attributes';
import { OpenSearchTracer } from '../../olly/callbacks/opensearch_tracer';
import { LLMModelFactory } from '../../olly/models/llm_model_factory';
import { PPLTools } from '../../olly/tools/tool_sets/ppl';
import { PPLGenerationRequestSchema } from '../../routes/langchain_routes';
import { ChatService } from './chat_service';
import { ML_COMMONS_BASE_API } from '../../olly/models/constants';

const MEMORY_ID_FIELD = 'memory_id';

export class OllyChatService implements ChatService {
  static abortControllers: Map<string, AbortController> = new Map();

  public async requestLLM(
    payload: { messages: IMessage[]; input: IInput; sessionId?: string; rootAgentId: string },
    context: RequestHandlerContext
  ): Promise<{
    messages: IMessage[];
    memoryId: string;
  }> {
    const { input, sessionId, rootAgentId } = payload;
    const opensearchClient = context.core.opensearch.client.asCurrentUser;

    if (payload.sessionId) {
      OllyChatService.abortControllers.set(payload.sessionId, new AbortController());
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
      if (sessionId) {
        parametersPayload.memory_id = sessionId;
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
