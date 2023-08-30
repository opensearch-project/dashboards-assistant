/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DynamicTool } from 'langchain/tools';
import { AggregationBucket, flatten, jsonToCsv, swallowErrors } from '../../utils/utils';
import { DATA_PREPPER_INDEX_NAME, JAEGER_INDEX_NAME } from './trace_tools/constants';
import { PluginToolsFactory } from '../tools_factory/tools_factory';
import {
  getDashboardQuery,
  getMode,
  runQuery,
  getTracesQuery,
  getServices,
} from './trace_tools/queries';
import { addFilters } from './trace_tools/filters';

export class TracesTools extends PluginToolsFactory {
  static TOOL_NAMES = {
    TRACE_GROUPS: 'Get trace groups',
    SERVICES: 'Get trace services',
    TRACES: 'Get traces',
  } as const;

  toolsList = [
    new DynamicTool({
      name: TracesTools.TOOL_NAMES.TRACE_GROUPS,
      description:
        'Use this to get information about each trace group. The input must be the entire original INPUT with no modification. The first line of the tool response is the column labels, which includes the key, doc_count, average_latency.value, trace_count.value, error_count.doc_count, error_count.trace_count.value, and error_rate.value. The key is the name of the trace group, the doc_count is the number of spans, the average_latency.value is the average latency of the trace group, measured in milliseconds. The trace_count.value is the number of traces in the trace group. The error_count.doc_count is the number of spans in the trace groups with errors, while the error_count.trace_count.value is the number of different traces in the trace group with errors. The error_rate.value is the percentage of traces in the trace group that has at least one error. There may be no trace groups',
      func: swallowErrors(async (userQuery: string) => this.getTraceGroups(userQuery)),
      callbacks: this.callbacks,
    }),
    new DynamicTool({
      name: TracesTools.TOOL_NAMES.TRACES,
      description:
        'Use this to get information about each trace. The input must be the entire original INPUT with no modification.  The tool response includes the key, doc_count, last_updated.value, last_updated.value_as_string, error_count.doc_count, trace_group.doc_count_error_upper_bound, trace_group.sum_other_doc_count, trace_group.buckets.0.key, and trace_groups.buckets.0.doc_count. The key is the ID of the trace. The doc_count is the number of spans in that particular trace. The last_updated.value_as_string is the last time that the trace was updated. The error_count.doc_count is how many spans in that trace has errors. The trace group.buckets.1.key is what trace group the trace belongs to. The other fields are irrelevant data.',
      func: swallowErrors(async (userQuery: string) => this.getTraces(userQuery)),
      callbacks: this.callbacks,
    }),
    new DynamicTool({
      name: TracesTools.TOOL_NAMES.SERVICES,
      description:
        'Use this to get information about each service in trace analytics. The input must be the entire original INPUT with no modification. The tool response includes the key, doc_count, error_count.doc_count, average_latency_nanos.value, average_latency.value, and error_rate.value. The key is the name of the service. The doc_count is the number of spans in the service. The error_count.doc_count is the number of traces with errors in the service. The average_latency.value is the average latency in milliseconds. The error_rate.value is the percentage of traces that had an error.',
      func: swallowErrors(async (userQuery: string) => this.getServices(userQuery)),
      callbacks: this.callbacks,
    }),
  ];

  public async getTraceGroups(userQuery: string) {
    const mode = await getMode(this.opensearchClient);
    const query = getDashboardQuery(mode);
    await addFilters(query, userQuery, this.model);
    return await runQuery(this.opensearchClient, query, mode, 'trace_group_name');
  }

  public async getTraces(userQuery: string) {
    const mode = await getMode(this.opensearchClient);
    const query = getTracesQuery(mode);
    await addFilters(query, userQuery, this.model);
    return await runQuery(this.opensearchClient, query, mode, 'traces');
  }

  public async getServices(userQuery: string) {
    const mode = await getMode(this.opensearchClient);
    const query = await getServices(mode, this.opensearchClient);
    await addFilters(query, userQuery, this.model);
    return await runQuery(this.opensearchClient, query, mode, 'service_name');
  }
}
