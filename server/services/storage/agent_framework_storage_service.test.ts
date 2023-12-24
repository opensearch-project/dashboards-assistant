/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentFrameworkStorageService } from './agent_framework_storage_service';
import { CoreRouteHandlerContext } from '../../../../../src/core/server/core_route_handler_context';
import { coreMock, httpServerMock } from '../../../../../src/core/server/mocks';
import { loggerMock } from '../../../../../src/core/server/logging/logger.mock';

describe('AgentFrameworkStorageService', () => {
  const coreContext = new CoreRouteHandlerContext(
    coreMock.createInternalStart(),
    httpServerMock.createOpenSearchDashboardsRequest()
  );
  const mockedTransport = coreContext.opensearch.client.asCurrentUser.transport
    .request as jest.Mock;
  const agentFrameworkService = new AgentFrameworkStorageService(
    coreContext.opensearch.client.asCurrentUser,
    []
  );
  beforeEach(() => {
    mockedTransport.mockReset();
  });
  it('getSession', async () => {
    mockedTransport.mockImplementation(async (params) => {
      if (params.path.includes('/_list?max_results=1000')) {
        return {
          body: {
            interactions: [
              {
                input: 'input',
                response: 'response',
              },
            ],
          },
        };
      }

      return {
        body: {
          conversation_id: 'conversation_id',
          create_time: 0,
          updated_time: 0,
          name: 'foo',
        },
      };
    });

    expect(await agentFrameworkService.getSession('session_mock')).toMatchInlineSnapshot(`
      Object {
        "createdTimeMs": 0,
        "interactions": Array [
          Object {
            "input": "input",
            "response": "response",
          },
        ],
        "messages": Array [],
        "title": "foo",
        "updatedTimeMs": 0,
      }
    `);
    expect(mockedTransport.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "method": "GET",
            "path": "/_plugins/_ml/memory/conversation/session_mock/_list?max_results=1000",
          },
        ],
        Array [
          Object {
            "method": "GET",
            "path": "/_plugins/_ml/memory/conversation/session_mock",
          },
        ],
      ]
    `);
  });

  it('getInteraction', async () => {
    mockedTransport.mockImplementation(async (params) => ({
      body: {
        input: 'input',
        response: 'response',
      },
    }));
    expect(agentFrameworkService.getInteraction('', '')).rejects.toMatchInlineSnapshot(
      `[Error: sessionId is required]`
    );
    expect(agentFrameworkService.getInteraction('session_id', '')).rejects.toMatchInlineSnapshot(
      `[Error: interactionId is required]`
    );
    expect(mockedTransport).toBeCalledTimes(0);
    expect(agentFrameworkService.getInteraction('session_id', 'interaction_id')).resolves
      .toMatchInlineSnapshot(`
      Object {
        "input": "input",
        "response": "response",
      }
    `);
    expect(mockedTransport).toBeCalledTimes(1);
  });
});
