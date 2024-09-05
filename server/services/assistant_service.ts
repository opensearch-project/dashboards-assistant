/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchDashboardsRequest, RequestHandlerContext } from '../../../../src/core/server';
import { AssistantClient } from './assistant_client';

export interface AssistantServiceSetup {
  getScopedClient: (
    request: OpenSearchDashboardsRequest,
    context: RequestHandlerContext
  ) => AssistantClient;
}

export class AssistantService {
  constructor() {}

  setup(): AssistantServiceSetup {
    return {
      getScopedClient: (request: OpenSearchDashboardsRequest, context: RequestHandlerContext) => {
        return new AssistantClient(request, context);
      },
    };
  }

  start() {}

  stop() {}
}
