/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter } from '../../../../src/core/server';
import { AGENT_API } from '../../common/constants/llm';
import { AssistantServiceSetup } from '../services/assistant_service';

export function registerAgentRoutes(router: IRouter, assistantService: AssistantServiceSetup) {
  router.post(
    {
      path: AGENT_API.EXECUTE,
      validate: {
        body: schema.any(),
        query: schema.oneOf([
          schema.object({
            dataSourceId: schema.maybe(schema.string()),
            agentId: schema.string(),
          }),
          schema.object({
            dataSourceId: schema.maybe(schema.string()),
            agentConfigName: schema.string(),
          }),
        ]),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      try {
        const assistantClient = assistantService.getScopedClient(req, context);
        if ('agentId' in req.query) {
          const response = await assistantClient.executeAgent(req.query.agentId, req.body);
          return res.ok({ body: response });
        }
        const response = await assistantClient.executeAgentByConfigName(
          req.query.agentConfigName,
          req.body
        );
        return res.ok({ body: response });
      } catch (e) {
        context.assistant_plugin.logger.error('Execute agent failed!', e);
        if (e.statusCode >= 400 && e.statusCode <= 499) {
          return res.customError({
            body: e.body,
            statusCode: e.statusCode,
            headers: e.headers,
          });
        } else {
          return res.customError({
            body: 'Execute agent failed!',
            statusCode: 500,
            headers: e.headers,
          });
        }
      }
    })
  );

  router.get(
    {
      path: AGENT_API.CONFIG_EXISTS,
      validate: {
        query: schema.oneOf([
          schema.object({
            dataSourceId: schema.maybe(schema.string()),
            agentConfigName: schema.oneOf([schema.string(), schema.arrayOf(schema.string())]),
          }),
        ]),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      try {
        const assistantClient = assistantService.getScopedClient(req, context);
        const promises = Array<string>()
          .concat(req.query.agentConfigName)
          .map((configName) => assistantClient.getAgentIdByConfigName(configName));
        const results = await Promise.all(promises);
        const exists = results.every((r) => Boolean(r));
        return res.ok({ body: { exists } });
      } catch (e) {
        return res.ok({ body: { exists: false } });
      }
    })
  );
}
