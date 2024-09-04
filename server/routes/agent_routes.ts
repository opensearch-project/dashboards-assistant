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
        query: schema.object({
          dataSourceId: schema.maybe(schema.string()),
        }),
        params: schema.object({
          agentId: schema.string(),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      try {
        const assistantClient = assistantService.getScopedClient(req, context);
        const response = await assistantClient.executeAgent(req.params.agentId, req.body);
        return res.ok({ body: response });
      } catch (e) {
        return res.internalError();
      }
    })
  );
}
