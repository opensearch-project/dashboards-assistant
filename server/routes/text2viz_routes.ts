/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter } from '../../../../src/core/server';
import { TEXT2VIZ_API } from '../../common/constants/llm';
import { getOpenSearchClientTransport } from '../utils/get_opensearch_client_transport';
import { ML_COMMONS_BASE_API } from '../utils/constants';
import { getAgent } from './get_agent';

const TEXT2VEGA_AGENT_CONFIG_ID = 'text2vega';
const TEXT2PPL_AGENT_CONFIG_ID = 'text2ppl';

export function registerText2VizRoutes(router: IRouter) {
  router.post(
    {
      path: TEXT2VIZ_API.TEXT2VEGA,
      validate: {
        body: schema.object({
          input: schema.string(),
          ppl: schema.string(),
          dataSchema: schema.string(),
          sampleData: schema.string(),
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
      const agentId = await getAgent(TEXT2VEGA_AGENT_CONFIG_ID, client);
      const response = await client.request({
        method: 'POST',
        path: `${ML_COMMONS_BASE_API}/agents/${agentId}/_execute`,
        body: {
          parameters: {
            input: req.body.input,
            ppl: req.body.ppl,
            dataSchema: req.body.dataSchema,
            sampleData: req.body.sampleData,
          },
        },
      });

      // let result = response.body.inference_results[0].output[0].dataAsMap;
      let result = JSON.parse(response.body.inference_results[0].output[0].result);
      // sometimes llm returns {response: <schema>} instead of <schema>
      if (result.response) {
        result = JSON.parse(result.response);
      }
      // Sometimes the response contains width and height which is not needed, here delete the these fields
      delete result.width;
      delete result.height;

      return res.ok({ body: result });
    })
  );

  router.post(
    {
      path: TEXT2VIZ_API.TEXT2PPL,
      validate: {
        body: schema.object({
          index: schema.string(),
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
      const agentId = await getAgent(TEXT2PPL_AGENT_CONFIG_ID, client);
      const response = await client.request({
        method: 'POST',
        path: `${ML_COMMONS_BASE_API}/agents/${agentId}/_execute`,
        body: {
          parameters: {
            question: req.body.question,
            index: req.body.index,
          },
        },
      });
      const result = JSON.parse(response.body.inference_results[0].output[0].result);
      return res.ok({ body: result });
    })
  );
}
