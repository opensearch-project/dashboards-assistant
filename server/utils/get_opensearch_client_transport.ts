/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchClient, RequestHandlerContext } from '../../../../src/core/server';

export class DataSourceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataSourceNotFoundError';
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
    try {
      return (await context.dataSource.opensearch.getClient(dataSourceId)).transport;
    } catch (err) {
      throw new DataSourceNotFoundError('Saved object does not belong to the workspace');
    }
  }
  return context.core.opensearch.client.asCurrentUser.transport;
};
