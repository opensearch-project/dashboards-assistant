/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LangchainTrace } from '../../../../../common/utils/llm_chat/traces';
import { PPLTools } from '../../../tools/tool_sets/ppl';
import { buildPPLOutputs } from '../ppl';
import { createMessage, createTrace } from './__utils__/test_helpers';

describe('build ppl', () => {
  it('builds ppl outputs', () => {
    const traces: LangchainTrace[] = [
      createTrace({
        type: 'tool',
        name: PPLTools.TOOL_NAMES.QUERY_OPENSEARCH,
        output:
          'The PPL query is: source=opensearch_dashboards_sample_data_flights | stats COUNT() AS count by span(timestamp, 1h)\n',
      }),
      createTrace({ type: 'tool' }),
    ];
    const outputs = buildPPLOutputs(traces, [createMessage()], 'input');
    expect(outputs).toEqual([
      createMessage(),
      {
        content:
          'source=opensearch_dashboards_sample_data_flights | stats COUNT() AS count by span(timestamp, 1h)',
        contentType: 'ppl_visualization',
        suggestedActions: [
          {
            actionType: 'view_ppl_visualization',
            message: 'View details',
            metadata: {
              query:
                'source=opensearch_dashboards_sample_data_flights | stats COUNT() AS count by span(timestamp, 1h)',
              question: 'input',
            },
          },
        ],
        type: 'output',
      },
    ]);
  });

  it('builds non-stats ppl outputs', () => {
    const traces: LangchainTrace[] = [
      createTrace({
        type: 'tool',
        name: PPLTools.TOOL_NAMES.QUERY_OPENSEARCH,
        output: 'The PPL query is: source=opensearch_dashboards_sample_data_flights\n',
      }),
    ];
    const outputs = buildPPLOutputs(traces, [createMessage()], 'input');
    expect(outputs[0].suggestedActions).toEqual([
      {
        actionType: 'save_and_view_ppl_query',
        message: 'Save query and view in Event Analytics',
        metadata: { query: 'source=opensearch_dashboards_sample_data_flights' },
      },
    ]);
  });

  it('builds multiple non-stats ppl outputs', () => {
    const traces: LangchainTrace[] = [
      createTrace({
        type: 'tool',
        name: PPLTools.TOOL_NAMES.QUERY_OPENSEARCH,
        output: 'The PPL query is: source=opensearch_dashboards_sample_data_flights\n',
      }),
      createTrace({
        type: 'tool',
        name: PPLTools.TOOL_NAMES.QUERY_OPENSEARCH,
        output: 'The PPL query is: source=opensearch_dashboards_sample_data_logs\n',
      }),
    ];
    const outputs = buildPPLOutputs(
      traces,
      [createMessage({ suggestedActions: [{ actionType: 'copy', message: 'Copy' }] })],
      'input'
    );
    expect(outputs[0].suggestedActions).toEqual([
      { actionType: 'copy', message: 'Copy' },
      {
        actionType: 'save_and_view_ppl_query',
        message: 'Save query (0) and view in Event Analytics',
        metadata: { query: 'source=opensearch_dashboards_sample_data_flights' },
      },
      {
        actionType: 'save_and_view_ppl_query',
        message: 'Save query (1) and view in Event Analytics',
        metadata: { query: 'source=opensearch_dashboards_sample_data_logs' },
      },
    ]);
  });

  it('ignores non-ppl outputs', () => {
    const traces: LangchainTrace[] = [
      createTrace({
        type: 'tool',
        name: PPLTools.TOOL_NAMES.QUERY_OPENSEARCH,
        output: 'Failed to generate',
      }),
    ];
    const outputs = buildPPLOutputs(traces, [createMessage()], 'input');
    expect(outputs).toEqual([createMessage()]);
  });
});
