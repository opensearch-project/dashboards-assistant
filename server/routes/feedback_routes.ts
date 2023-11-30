/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import {
  HttpResponsePayload,
  IOpenSearchDashboardsResponse,
  IRouter,
  ResponseError,
} from '../../../../src/core/server';
import { ASSISTANT_API, LLM_INDEX } from '../../common/constants/llm';

export function registerFeedbackRoutes(router: IRouter) {
  router.post(
    {
      path: ASSISTANT_API.FEEDBACK,
      validate: {
        body: schema.object({
          metadata: schema.object({
            user: schema.string(),
            tenant: schema.string(),
            type: schema.string(),
            sessionId: schema.maybe(schema.string()),
            traceId: schema.maybe(schema.string()),
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
