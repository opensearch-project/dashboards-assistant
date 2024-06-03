/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchClient, RequestHandlerContext } from '../../../../src/core/server';

export const getOpenSearchClientTransport = async ({
  context,
  dataSourceId,
}: {
  context: RequestHandlerContext & {
    dataSource?: {
      opensearch: {
        getClient: (dataSourceId: string) => Promise<OpenSearchClient>;
      };
    };
  };
  dataSourceId?: string;
}) => {
  if (dataSourceId && context.dataSource) {
    return (await context.dataSource.opensearch.getClient(dataSourceId)).transport;
  }
  return context.core.opensearch.client.asCurrentUser.transport;
};
