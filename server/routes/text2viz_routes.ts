/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter } from '../../../../src/core/server';
import {
  TEXT2PPL_AGENT_CONFIG_ID,
  TEXT2VEGA_RULE_BASED_AGENT_CONFIG_ID,
  TEXT2VEGA_INPUT_SIZE_LIMIT,
  TEXT2VEGA_WITH_INSTRUCTIONS_AGENT_CONFIG_ID,
  TEXT2VIZ_API,
} from '../../common/constants/llm';
import { AssistantServiceSetup } from '../services/assistant_service';

const inputSchema = schema.string({
  maxLength: TEXT2VEGA_INPUT_SIZE_LIMIT,
  validate(value) {
    if (!value || value.trim().length === 0) {
      return "can't be empty or blank.";
    }
  },
});

export function registerText2VizRoutes(router: IRouter, assistantService: AssistantServiceSetup) {
  router.post(
    {
      path: TEXT2VIZ_API.TEXT2VEGA,
      validate: {
        body: schema.object({
          input_question: inputSchema,
          input_instruction: schema.maybe(schema.string({ maxLength: TEXT2VEGA_INPUT_SIZE_LIMIT })),
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
      const assistantClient = assistantService.getScopedClient(req, context);
      try {
        const agentConfigName = req.body.input_instruction
          ? TEXT2VEGA_WITH_INSTRUCTIONS_AGENT_CONFIG_ID
          : TEXT2VEGA_RULE_BASED_AGENT_CONFIG_ID;
        const response = await assistantClient.executeAgentByConfigName(agentConfigName, {
          input_question: req.body.input_question,
          input_instruction: req.body.input_instruction,
          ppl: req.body.ppl,
          dataSchema: req.body.dataSchema,
          sampleData: req.body.sampleData,
        });

        let textContent = response.body.inference_results[0].output[0].result;

        // extra content between tag <vega-lite></vega-lite>
        const startTag = '<vega-lite>';
        const endTag = '</vega-lite>';

        const startIndex = textContent.indexOf(startTag);
        const endIndex = textContent.indexOf(endTag);

        if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
          // Extract the content between the tags
          textContent = textContent.substring(startIndex + startTag.length, endIndex).trim();
        }

        // extract json object
        const jsonMatch = textContent.match(/\{.*\}/s);
        if (jsonMatch) {
          let result = JSON.parse(jsonMatch[0]);
          // sometimes llm returns {response: <schema>} instead of <schema>
          if (result.response) {
            result = JSON.parse(result.response);
          }
          // Sometimes the response contains width and height which is not needed, here delete the these fields
          delete result.width;
          delete result.height;

          // make sure $schema field always been added, sometimes, LLM 'forgot' to add this field
          result.$schema = 'https://vega.github.io/schema/vega-lite/v5.json';
          return res.ok({ body: result });
        }
        return res.badRequest();
      } catch (e) {
        context.assistant_plugin.logger.error('Execute agent failed!', e);
        if (e.statusCode >= 400 && e.statusCode <= 499) {
          return res.customError({
            body: { message: typeof e.body === 'string' ? e.body : JSON.stringify(e.body) },
            statusCode: e.statusCode,
          });
        } else {
          return res.customError({
            body: 'Execute agent failed!',
            statusCode: 500,
          });
        }
      }
    })
  );

  router.post(
    {
      path: TEXT2VIZ_API.TEXT2PPL,
      validate: {
        body: schema.object({
          index: schema.string(),
          question: inputSchema,
        }),
        query: schema.object({
          dataSourceId: schema.maybe(schema.string()),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const assistantClient = assistantService.getScopedClient(req, context);
      try {
        const response = await assistantClient.executeAgentByConfigName(TEXT2PPL_AGENT_CONFIG_ID, {
          question: req.body.question,
          index: req.body.index,
        });

        const result = JSON.parse(response.body.inference_results[0].output[0].result);
        return res.ok({ body: result });
      } catch (e) {
        context.assistant_plugin.logger.error('Execute agent failed!', e);
        if (e.statusCode >= 400 && e.statusCode <= 499) {
          return res.customError({
            body: { message: typeof e.body === 'string' ? e.body : JSON.stringify(e.body) },
            statusCode: e.statusCode,
          });
        } else {
          return res.customError({
            body: 'Execute agent failed!',
            statusCode: 500,
          });
        }
      }
    })
  );
}
