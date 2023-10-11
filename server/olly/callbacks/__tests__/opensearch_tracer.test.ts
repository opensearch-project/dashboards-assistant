/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Run } from 'langchain/callbacks';
import { opensearchClientMock } from '../../../../../../src/core/server/opensearch/client/mocks';
import { LLM_INDEX } from '../../../../common/constants/llm';
import { OpenSearchTracer } from '../opensearch_tracer';

class OpenSearchTracerTest extends OpenSearchTracer {
  constructor(...args: ConstructorParameters<typeof OpenSearchTracer>) {
    super(...args);
  }

  public _persistRun(_run: Run) {
    return super.persistRun(_run);
  }
}

describe('langchain opensearch tracer', () => {
  let client: ReturnType<typeof opensearchClientMock.createOpenSearchClient>;
  const run = ({
    level: 0,
    child_runs: [{ level: 1, child_runs: [{ level: 2 }] }, { level: 1 }],
  } as unknown) as Run;

  beforeEach(() => {
    client = opensearchClientMock.createOpenSearchClient();
  });

  it('creates index', async () => {
    client.indices.exists.mockResolvedValue(
      opensearchClientMock.createSuccessTransportRequestPromise(false)
    );
    const tracer = new OpenSearchTracerTest(client, 'test-session', []);
    await tracer._persistRun(run);
    expect(client.indices.create).toHaveBeenCalledWith(
      expect.objectContaining({
        index: LLM_INDEX.TRACES,
        body: {
          settings: { index: expect.objectContaining({ mapping: { ignore_malformed: true } }) },
          mappings: expect.objectContaining({ dynamic: 'false' }),
        },
      })
    );
  });

  it('skips creating index if exists', async () => {
    client.indices.exists.mockResolvedValue(
      opensearchClientMock.createSuccessTransportRequestPromise(true)
    );
    const tracer = new OpenSearchTracerTest(client, 'test-session', []);
    await tracer._persistRun(run);
    expect(client.indices.create).toHaveBeenCalledTimes(0);
  });

  it('converts and sends run as docs', async () => {
    const runs: Run[] = [];
    const tracer = new OpenSearchTracerTest(client, 'test-session', runs);
    await tracer._persistRun(run);
    expect(client.bulk).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.arrayContaining([
          { index: { _index: LLM_INDEX.TRACES } },
          { level: 0, trace_id: 'test-session' },
          { level: 1, trace_id: 'test-session' },
          { level: 2, trace_id: 'test-session' },
        ]),
      })
    );
    expect(runs).toEqual([run]);
  });

  it('does not throw errors', async () => {
    client.bulk.mockRejectedValue('failed to index');
    const tracer = new OpenSearchTracerTest(client, 'test-session', []);
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    await expect(tracer._persistRun(run)).resolves.not.toThrowError();
    expect(consoleError).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});
