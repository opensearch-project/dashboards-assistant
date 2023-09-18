/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { LLMChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';
import { v4 as uuid } from 'uuid';
import {
  HttpResponsePayload,
  ILegacyScopedClusterClient,
  IOpenSearchDashboardsResponse,
  IRouter,
  ResponseError,
} from '../../../../../src/core/server';
import { LANGCHAIN_API, LLM_INDEX } from '../../../common/constants/llm';
import { OpenSearchTracer } from '../../olly/callbacks/opensearch_tracer';
import { LLMModelFactory } from '../../olly/models/llm_model_factory';
import { MLCommonsChatModel } from '../../olly/models/mlcommons_chat_model';
import { PPLTools } from '../../olly/tools/tool_sets/ppl';

export function registerLangChainRoutes(router: IRouter) {
  router.post(
    {
      path: LANGCHAIN_API.PPL_GENERATOR,
      validate: {
        body: schema.object({
          index: schema.string(),
          question: schema.string(),
        }),
      },
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      const { index, question } = request.body;
      const sessionId = uuid();
      const observabilityClient: ILegacyScopedClusterClient = context.assistant_plugin.observabilityClient.asScoped(
        request
      );
      const opensearchClient = context.core.opensearch.client.asCurrentUser;
      const savedObjectsClient = context.core.savedObjects.client;

      try {
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
        const ppl = await pplTools.generatePPL(question, index);

        return response.ok({ body: ppl });
      } catch (error) {
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.post(
    {
      path: LANGCHAIN_API.AGENT_TEST,
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

  router.post(
    {
      path: LANGCHAIN_API.FEEDBACK,
      validate: {
        body: schema.object({
          metadata: schema.object({
            type: schema.string(),
            chatId: schema.maybe(schema.string()),
            sessionId: schema.maybe(schema.string()),
            error: schema.maybe(schema.boolean()),
            selectedIndex: schema.maybe(schema.string()),
          }),
          input: schema.string(),
          output: schema.string(),
          correct: schema.boolean(),
          expectedOutput: schema.string(),
          comment: schema.string(),
        }),
      },
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<HttpResponsePayload | ResponseError>> => {
      try {
        await context.core.opensearch.client.asCurrentUser.index({
          index: LLM_INDEX.FEEDBACK,
          body: { ...request.body, timestamp: new Date().toISOString() },
        });

        return response.ok();
      } catch (error) {
        console.error(error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );
}
