/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter } from '../../../../src/core/server';
import { SUMMARY_ASSISTANT_API } from '../../common/constants/llm';
import { getOpenSearchClientTransport } from '../utils/get_opensearch_client_transport';
import { getAgent } from './get_agent';
import { ML_COMMONS_BASE_API } from '../utils/constants';

const SUMMARY_AGENT_CONFIG_ID = 'summary';

export function registerSummaryAssistantRoutes(router: IRouter) {
  router.post(
    {
      path: SUMMARY_ASSISTANT_API.SUMMARIZE_VIZ,
      validate: {
        body: schema.object({
          vizData: schema.string(),
          vizParams: schema.string(),
          prompt: schema.string(),
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
      const response = await client.request({
        method: 'POST',
        path: `${ML_COMMONS_BASE_API}/agents/${agentId}/_execute`,
        body: {
          parameters: {
            vizData: req.body.vizData,
            vizParams: req.body.vizParams,
            prompt: req.body.prompt,
          },
        },
      });
      try {
        const result = JSON.parse(response.body.inference_results[0].output[0].result);
        return res.ok({ body: result });
      } catch (e) {
        return res.internalError();
      }
    })
  );
}
