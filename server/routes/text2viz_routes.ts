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

export function registerText2VizRoutes(router: IRouter) {
  router.post(
    {
      path: TEXT2VIZ_API.TEXT2VEGA,
      validate: {
        body: schema.object({
          query: schema.string(),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const result = await context.core.opensearch.client.asCurrentUser.transport.request({
        method: 'POST',
        path: '/_plugins/_ml/models/_yV0hY8B8ef_5QXJp6Xd/_predict',
        body: {
          parameters: {
            prompt: req.body.query,
          },
        },
      });
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
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const result = await context.core.opensearch.client.asCurrentUser.transport.request({
        method: 'POST',
        path: '/_plugins/_ml/agents/uJmpgI8BGmD7E2dhTm4e/_execute',
        body: {
          parameters: {
            question: req.body.question,
            index: req.body.index,
          },
        },
      });
      return res.ok({ body: result });
    })
  );
}
