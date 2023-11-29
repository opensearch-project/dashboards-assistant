/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';
import { Run } from 'langchain/callbacks';
import { LLMChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';
import { v4 as uuid } from 'uuid';
import {
  HttpResponsePayload,
  ILegacyScopedClusterClient,
  IOpenSearchDashboardsResponse,
  IRouter,
  ResponseError,
} from '../../../../src/core/server';
import { ASSISTANT_API, LLM_INDEX } from '../../common/constants/llm';
import { OpenSearchTracer } from '../olly/callbacks/opensearch_tracer';
import { requestSummarizationChain } from '../olly/chains/summarization';
import { LLMModelFactory } from '../olly/models/llm_model_factory';
import { MLCommonsChatModel } from '../olly/models/mlcommons_chat_model';
import { OllyChatService } from '../services/chat/olly_chat_service';

const pplGenerationRoute = {
  path: ASSISTANT_API.PPL_GENERATOR,
  validate: {
    body: schema.object({
      index: schema.string(),
      question: schema.string(),
    }),
  },
};
export type PPLGenerationRequestSchema = TypeOf<typeof pplGenerationRoute.validate.body>;

const summarizationRoute = {
  path: ASSISTANT_API.SUMMARIZATION,
  validate: {
    body: schema.object({
      question: schema.string(),
      response: schema.string(),
      query: schema.maybe(schema.string()),
      isError: schema.boolean(),
      index: schema.string(),
    }),
  },
};
export type SummarizationRequestSchema = TypeOf<typeof summarizationRoute.validate.body>;

export function registerLangchainRoutes(router: IRouter) {
  router.post(
    pplGenerationRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const chatService = new OllyChatService();
      try {
        const ppl = await chatService.generatePPL(context, request);
        return response.ok({ body: ppl });
      } catch (error) {
        context.assistant_plugin.logger.warn(error);
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );

  router.post(
    summarizationRoute,
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      try {
        const runs: Run[] = [];
        const traceId = uuid();
        const opensearchClient = context.core.opensearch.client.asCurrentUser;
        const callbacks = [new OpenSearchTracer(opensearchClient, traceId, runs)];
        const model = LLMModelFactory.createModel({ client: opensearchClient });
        const chainResponse = await requestSummarizationChain(
          { client: opensearchClient, model, ...request.body },
          callbacks
        );
        return response.ok({ body: chainResponse });
      } catch (error) {
        context.assistant_plugin.logger.warn(error);
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );

  router.post(
    {
      path: ASSISTANT_API.AGENT_TEST,
      validate: {
        body: schema.object({
          question: schema.string(),
        }),
      },
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      try {
        const { question } = request.body;
        const opensearchObservabilityClient: ILegacyScopedClusterClient = context.assistant_plugin.observabilityClient.asScoped(
          request
        );
        console.log('########### START CHAIN ####################');
        // We can construct an LLMChain from a PromptTemplate and an LLM.
        const model = new MLCommonsChatModel({}, context.core.opensearch.client.asCurrentUser);
        const prompt = PromptTemplate.fromTemplate(
          'What is a good name for a company that makes {product}?'
        );
        const chainA = new LLMChain({ llm: model, prompt });

        // The result is an object with a `text` property.
        const resA = await chainA.call({ product: 'colorful socks' });
        console.log('########### END CHAIN ####################');
        return response.ok({ body: resA });
      } catch (error) {
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );
}
