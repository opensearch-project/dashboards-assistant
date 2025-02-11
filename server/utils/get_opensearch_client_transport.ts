/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchClient, RequestHandlerContext } from '../../../../src/core/server';

interface ErrorWithStatusCode extends Error {
  statusCode?: number;
}

export class DataSourceNotFoundError extends Error {
  public readonly statusCode: number;
  constructor(message: string, originalError?: ErrorWithStatusCode) {
    super(message);
    this.name = 'DataSourceNotFoundError';
    this.statusCode = originalError?.statusCode || 403;
  }
}

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
