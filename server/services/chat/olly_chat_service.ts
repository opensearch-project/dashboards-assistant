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
import { OpenSearchTracer } from '../../olly/callbacks/opensearch_tracer';
import { LLMModelFactory } from '../../olly/models/llm_model_factory';
import { PPLTools } from '../../olly/tools/tool_sets/ppl';
import { buildOutputs } from '../../olly/utils/output_builders/build_outputs';
import { AbortAgentExecutionSchema, LLMRequestSchema } from '../../routes/chat_routes';
import { PPLGenerationRequestSchema } from '../../routes/langchain_routes';
import { ChatService } from './chat_service';

const MEMORY_ID_FIELD = 'memory_id';
const RESPONSE_FIELD = 'response';

export class OllyChatService implements ChatService {
  static abortControllers: Map<string, AbortController> = new Map();

  public async requestLLM(
    payload: { messages: IMessage[]; input: IInput; sessionId?: string },
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest<unknown, unknown, LLMRequestSchema, 'post'>
  ): Promise<{
    messages: IMessage[];
    memoryId: string;
  }> {
    const { input, sessionId, rootAgentId } = request.body;
    const opensearchClient = context.core.opensearch.client.asCurrentUser;

    if (payload.sessionId) {
      OllyChatService.abortControllers.set(payload.sessionId, new AbortController());
    }

    try {
      const runs: Run[] = [];

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
        path: `/_plugins/_ml/agents/${rootAgentId}/_execute`,
        body: {
          parameters: parametersPayload,
        },
      })) as ApiResponse<{
        inference_results: Array<{
          output: Array<{ name: string; result?: string }>;
        }>;
      }>;
      const outputBody =
        agentFrameworkResponse.body.inference_results?.[0]?.output ||
        agentFrameworkResponse.body.inference_results?.[0]?.output;
      const memoryIdItem = outputBody?.find((item) => item.name === MEMORY_ID_FIELD);
      const reversedOutputBody = [...outputBody].reverse();
      const finalAnswerItem = reversedOutputBody.find((item) => item.name === RESPONSE_FIELD);

      const agentFrameworkAnswer = finalAnswerItem?.result || '';

      return {
        messages: buildOutputs(input.content, agentFrameworkAnswer, '', {}, convertToTraces(runs)),
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
