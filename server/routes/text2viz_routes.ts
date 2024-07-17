/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';
import {
  HttpResponsePayload,
  IOpenSearchDashboardsResponse,
  IRouter,
  RequestHandlerContext,
} from '../../../../src/core/server';
import { TEXT2VIZ_API } from '../../common/constants/llm';
import { getOpenSearchClientTransport } from '../utils/get_opensearch_client_transport';
import { ML_COMMONS_BASE_API } from '../utils/constants';
import { getAgent } from './get_agent';

// const createPrompt = (input: string, ppl: string, sampleData: string, dataSchema: string) => {
//   return `
// You're an expert at creating vega-lite visualization. No matter what the user asks, you should reply with a valid vega-lite specification in json.
// Your task is to generate Vega-Lite specification in json based on the given sample data, the schema of the data, the PPL query to get the data and the user's input.
//
// Besides, here are some requirements:
// 1. Do not contain the key called 'data' in vega-lite specification.
// 2. If mark.type = point and shape.field is a field of the data, the definition of the shape should be inside the root "encoding" object, NOT in the "mark" object, for example, {"encoding": {"shape": {"field": "field_name"}}}
// 3. Please also generate title and description
//
// The sample data in json format:
// ${sampleData}
//
// This is the schema of the data:
// ${dataSchema}
//
// The user used this PPL query to get the data: ${ppl}
//
// The user's input is: ${input}
//
// Now please reply a valid vega-lite specification in json based on above instructions.
// `;
// };

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
      const agentId = getAgent(TEXT2VEGA_AGENT_CONFIG_ID, client);
      const response = await client.request({
        method: 'POST',
        path: `${ML_COMMONS_BASE_API}/agents/${agentId}/_execute`,
        // path: `${ML_COMMONS_BASE_API}/models/_yV0hY8B8ef_5QXJp6Xd/_predict`,
        body: {
          parameters: {
            // prompt: createPrompt(
            //   req.body.input,
            //   req.body.ppl,
            //   req.body.sampleData,
            //   req.body.dataSchema
            // ),
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
      const agentId = getAgent(TEXT2PPL_AGENT_CONFIG_ID, client);
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
