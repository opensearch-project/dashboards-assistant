/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter, OpenSearchClient } from '../../../../src/core/server';
import { SUMMARY_ASSISTANT_API } from '../../common/constants/llm';
import { getOpenSearchClientTransport } from '../utils/get_opensearch_client_transport';
import { getAgentIdByConfigName, searchAgent } from './get_agent';
import { AssistantServiceSetup } from '../services/assistant_service';
import { handleError } from './error_handler';
import { AgentNotFoundError } from './errors';

const SUMMARY_AGENT_CONFIG_ID = 'os_summary';
const LOG_PATTERN_SUMMARY_AGENT_CONFIG_ID = 'os_summary_with_log_pattern';
const OS_INSIGHT_AGENT_CONFIG_ID = 'os_insight';
const DATA2SUMMARY_AGENT_CONFIG_ID = 'os_data2summary';

export function postProcessing(output: string) {
  const pattern = /<summarization>(.*?)<\/summarization>.*?<final insights>(.*?)<\/final insights>/s;
  const match = output.match(pattern);
  if (match) {
    const [, summarization, finalInsights] = match;
    const processedOutput = `${summarization.trim()}\n${finalInsights.trim()}`;
    return processedOutput;
  }
  return output;
}

export function registerSummaryAssistantRoutes(
  router: IRouter,
  assistantService: AssistantServiceSetup
) {
  router.post(
    {
      path: SUMMARY_ASSISTANT_API.SUMMARIZE,
      validate: {
        body: schema.object({
          summaryType: schema.string(),
          insightType: schema.maybe(schema.string()),
          question: schema.string(),
          context: schema.maybe(schema.string()),
          index: schema.maybe(schema.string()),
          dsl: schema.maybe(schema.string()),
          topNLogPatternData: schema.maybe(schema.string()),
        }),
        query: schema.object({
          dataSourceId: schema.maybe(schema.string()),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const client = await getOpenSearchClientTransport({
        context,
        dataSourceId: req.query.dataSourceId,
      });
      const assistantClient = assistantService.getScopedClient(req, context);
      const agentConfigId =
        req.body.index && req.body.dsl
          ? LOG_PATTERN_SUMMARY_AGENT_CONFIG_ID
          : SUMMARY_AGENT_CONFIG_ID;
      try {
        const response = await assistantClient.executeAgentByConfigName(agentConfigId, {
          context: req.body.context,
          question: req.body.question,
          index: req.body.index,
          input: req.body.dsl,
          topNLogPatternData: req.body.topNLogPatternData,
        });

        let insightAgentIdExists = false;
        if (req.body.insightType) {
          insightAgentIdExists = !!(await detectInsightAgentId(
            req.body.insightType,
            req.body.summaryType,
            client
          ));
        }

        const summary = response.body.inference_results[0]?.output[0]?.result;
        if (!summary) {
          return res.customError({
            body: 'Execute agent failed with empty response!',
            statusCode: 500,
          });
        }
        return res.ok({ body: { summary, insightAgentIdExists } });
      } catch (e) {
        return handleError(e, res, context.assistant_plugin.logger);
      }
    })
  );

  router.post(
    {
      path: SUMMARY_ASSISTANT_API.INSIGHT,
      validate: {
        body: schema.object({
          summaryType: schema.string(),
          insightType: schema.string(),
          summary: schema.string(),
          context: schema.string(),
          question: schema.string(),
        }),
        query: schema.object({
          dataSourceId: schema.maybe(schema.string()),
        }),
      },
    },

    router.handleLegacyErrors(async (context, req, res) => {
      try {
        const client = await getOpenSearchClientTransport({
          context,
          dataSourceId: req.query.dataSourceId,
        });

        const assistantClient = assistantService.getScopedClient(req, context);

        const insightAgentId = await detectInsightAgentId(
          req.body.insightType,
          req.body.summaryType,
          client
        );
        if (!insightAgentId) {
          return res.notFound({ body: 'Agent not found' });
        }

        const response = await assistantClient.executeAgent(insightAgentId, {
          context: req.body.context,
          summary: req.body.summary,
          question: req.body.question,
        });

        const insight = response.body.inference_results[0]?.output[0]?.result;
        if (!insight) {
          return res.customError({
            body: 'Execute agent failed with empty response!',
            statusCode: 500,
          });
        }
        return res.ok({ body: { insight } });
      } catch (e) {
        return handleError(e, res, context.assistant_plugin.logger);
      }
    })
  );
}

async function detectInsightAgentId(
  insightType: string,
  summaryType: string,
  client: OpenSearchClient['transport']
) {
  // We have separate agent for os_insight and user_insight. And for user_insight, we can
  // only get it by searching on name since it is not stored in agent config.
  try {
    if (insightType === 'os_insight') {
      return await getAgentIdByConfigName(OS_INSIGHT_AGENT_CONFIG_ID, client);
    } else if (insightType === 'user_insight' && summaryType === 'alerts') {
      return await searchAgent({ name: 'KB_For_Alert_Insight' }, client);
    }
  } catch (e) {
    // It only detects if the agent exists, we don't want to throw the error when not found the agent
    // So we return `undefined` to indicate the insight agent id not found
    if (e instanceof AgentNotFoundError) {
      return undefined;
    }
    throw e;
  }
}

export function registerData2SummaryRoutes(
  router: IRouter,
  assistantService: AssistantServiceSetup
) {
  router.post(
    {
      path: SUMMARY_ASSISTANT_API.DATA2SUMMARY,
      validate: {
        body: schema.object({
          sample_data: schema.string(),
          sample_count: schema.maybe(schema.number()),
          total_count: schema.maybe(schema.number()),
          question: schema.maybe(schema.string()),
          ppl: schema.maybe(schema.string()),
        }),
        query: schema.object({
          dataSourceId: schema.maybe(schema.string()),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const assistantClient = assistantService.getScopedClient(req, context);
      try {
        const response = await assistantClient.executeAgentByConfigName(
          DATA2SUMMARY_AGENT_CONFIG_ID,
          {
            sample_data: req.body.sample_data,
            total_count: req.body.total_count,
            sample_count: req.body.sample_count,
            ppl: req.body.ppl,
            question: req.body.question,
          }
        );

        let result = response.body.inference_results[0].output[0].result;

        result = postProcessing(result);

        if (result) {
          return res.ok({ body: result });
        } else {
          return res.customError({
            body: 'Execute agent failed with empty response!',
            statusCode: 500,
          });
        }
      } catch (e) {
        return handleError(e, res, context.assistant_plugin.logger);
      }
    })
  );
}
