/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseTracer, Run } from 'langchain/callbacks';
import { omit } from 'lodash';
import { OpenSearchClient } from '../../../../../src/core/server';
import { LLM_INDEX } from '../../../common/constants/llm';

export class OpenSearchTracer extends BaseTracer {
  name = 'opensearch_tracer' as const;

  constructor(private client: OpenSearchClient, private traceID: string, private runs?: Run[]) {
    super();
  }

  protected async persistRun(_run: Run) {
    this.runs?.push(_run);
    try {
      await this.createIndex();
      await this.indexRun(_run);
    } catch (error) {
      console.error('failed to persist langchain trace', error); // do not crash server if request failed
    }
  }

  private async indexRun(run: Run) {
    const body = this.flattenRunToDocs(run).flatMap((doc) => [
      { index: { _index: LLM_INDEX.TRACES } },
      doc,
    ]);
    return this.client.bulk({ refresh: true, body });
  }

  private flattenRunToDocs(run: Run, docs: Array<Partial<Run & { trace_id: string }>> = []) {
    docs.push({ trace_id: this.traceID, ...omit(run, 'child_runs') });
    if (run.child_runs) run.child_runs.forEach((childRun) => this.flattenRunToDocs(childRun, docs));
    return docs;
  }

  private async createIndex() {
    const existsResponse = await this.client.indices.exists({ index: LLM_INDEX.TRACES });
    if (!existsResponse.body) {
      return this.client.indices.create({
        index: LLM_INDEX.TRACES,
        body: {
          settings: {
            index: {
              number_of_shards: '1',
              auto_expand_replicas: '0-2',
              mapping: { ignore_malformed: true },
            },
          },
          mappings: {
            dynamic: 'false',
            properties: {
              actions: { properties: { tool: { type: 'keyword' } } },
              child_execution_order: { type: 'integer' },
              end_time: { type: 'date' },
              execution_order: { type: 'integer' },
              id: { type: 'keyword' },
              name: { type: 'keyword' },
              parent_run_id: { type: 'keyword' },
              trace_id: { type: 'keyword' },
              start_time: { type: 'date' },
            },
          },
        },
      });
    }
  }
}
