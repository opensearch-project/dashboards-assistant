/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter } from '../../../../src/core/server';
import { SUMMARY_ASSISTANT_API } from '../../common/constants/llm';
import { getOpenSearchClientTransport } from '../utils/get_opensearch_client_transport';
import { getAgent, searchAgentByName } from './get_agent';
import { ML_COMMONS_BASE_API } from '../utils/constants';
import { InsightType, SummaryType } from '../types';

const SUMMARY_AGENT_CONFIG_ID = 'os_general_llm';
const OS_INSIGHT_AGENT_CONFIG_ID = 'os_insight';
let osInsightAgentId: string | undefined;
let userInsightAgentId: string | undefined;

export function registerSummaryAssistantRoutes(router: IRouter) {
  router.post(
    {
      path: SUMMARY_ASSISTANT_API.SUMMARIZE,
      validate: {
        body: schema.object({
          type: schema.string(),
          insightType: schema.maybe(schema.string()),
          question: schema.string(),
          context: schema.maybe(schema.string()),
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
      const agentId = await getAgent(SUMMARY_AGENT_CONFIG_ID, client);
      const prompt = SummaryType.find((type) => type.id === req.body.type)?.prompt;
      const response = await client.request({
        method: 'POST',
        path: `${ML_COMMONS_BASE_API}/agents/${agentId}/_execute`,
        body: {
          parameters: {
            prompt,
            context: req.body.context,
            question: req.body.question,
          },
        },
      });
      let summary;
      let insightAgentIdExists = false;
      try {
        if (req.body.insightType) {
          // We have separate agent for os_insight and user_insight. And for user_insight, we can
          // only get it by searching on name since it is not stored in agent config.
          if (req.body.insightType === 'os_insight') {
            if (!osInsightAgentId) {
              osInsightAgentId = await getAgent(OS_INSIGHT_AGENT_CONFIG_ID, client);
            }
            insightAgentIdExists = !!osInsightAgentId;
          } else if (req.body.insightType === 'user_insight') {
            if (req.body.type === 'alerts') {
              if (!userInsightAgentId) {
                userInsightAgentId = await searchAgentByName('KB_For_Alert_Insight', client);
              }
            }
            insightAgentIdExists = !!userInsightAgentId;
          }
        }
      } catch (e) {
        context.assistant_plugin.logger.info(
          `Cannot find insight agent for ${req.body.insightType}`
        );
      }
      try {
        summary = response.body.inference_results[0].output[0].result;
        return res.ok({ body: { summary, insightAgentIdExists } });
      } catch (e) {
        return res.internalError();
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
      const client = await getOpenSearchClientTransport({
        context,
        dataSourceId: req.query.dataSourceId,
      });
      const prompt = InsightType.find((type) => type.id === req.body.summaryType)?.prompt;
      const insightAgentId =
        req.body.insightType === 'os_insight' ? osInsightAgentId : userInsightAgentId;
      const response = await client.request({
        method: 'POST',
        path: `${ML_COMMONS_BASE_API}/agents/${insightAgentId}/_execute`,
        body: {
          parameters: {
            text: prompt,
            context: req.body.context,
            summary: req.body.summary,
            question: req.body.question,
          },
        },
      });
      try {
        let result = response.body.inference_results[0].output[0].result;
        result = JSON.parse(result).output.text;
        return res.ok({ body: result });
      } catch (e) {
        return res.internalError();
      } finally {
        // Reset userInsightAgentId in case users update their insight agent.
        userInsightAgentId = undefined;
      }
    })
  );
}
