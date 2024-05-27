/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getOpenSearchClientTransport } from './get_opensearch_client_transport';
import { coreMock } from '../../../../src/core/server/mocks';
import { loggerMock } from '../../../../src/core/server/logging/logger.mock';

const mockedLogger = loggerMock.create();

describe('getOpenSearchClientTransport', () => {
  it('should return current user opensearch transport', async () => {
    const core = coreMock.createRequestHandlerContext();

    expect(
      await getOpenSearchClientTransport({
        context: { core, assistant_plugin: { logger: mockedLogger } },
      })
    ).toBe(core.opensearch.client.asCurrentUser.transport);
  });
  it('should data source id related opensearch transport', async () => {
    const transportMock = {};
    const core = coreMock.createRequestHandlerContext();
    const context = {
      core,
      dataSource: {
        opensearch: {
          getClient: async (_dataSourceId: string) => ({
            transport: transportMock,
          }),
        },
      },
    };

    expect(
      await getOpenSearchClientTransport({
        context: { core, assistant_plugin: { logger: mockedLogger } },
        dataSourceId: 'foo',
      })
    ).toBe(transportMock);
  });
});
