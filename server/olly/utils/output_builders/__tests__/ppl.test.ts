/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

describe('build ppl', () => {
  it.skip('builds ppl outputs', () => {
    // const traces: LangchainTrace[] = [
    //   createTrace({
    //     type: 'tool',
    //     name: PPLTools.TOOL_NAMES.QUERY_OPENSEARCH,
    //     output:
    //       'The PPL query is: source=opensearch_dashboards_sample_data_flights | stats COUNT() AS count by span(timestamp, 1h)\n',
    //   }),
    //   createTrace({ type: 'tool' }),
    // ];
    // const outputs = buildPPLOutputs(traces, [createMessage()], 'input');
    // expect(outputs).toEqual([
    //   createMessage(),
    //   {
    //     content:
    //       'source=opensearch_dashboards_sample_data_flights | stats COUNT() AS count by span(timestamp, 1h)',
    //     contentType: 'ppl_visualization',
    //     suggestedActions: [
    //       {
    //         actionType: 'view_ppl_visualization',
    //         message: 'View details',
    //         metadata: {
    //           query:
    //             'source=opensearch_dashboards_sample_data_flights | stats COUNT() AS count by span(timestamp, 1h)',
    //           question: 'input',
    //         },
    //       },
    //     ],
    //     type: 'output',
    //   },
    // ]);
  });

  it.skip('ignores non-ppl outputs', () => {
    // const traces: LangchainTrace[] = [
    //   createTrace({
    //     type: 'tool',
    //     name: PPLTools.TOOL_NAMES.QUERY_OPENSEARCH,
    //     output: 'Failed to generate',
    //   }),
    // ];
    // const outputs = buildPPLOutputs(traces, [createMessage()], 'input');
    // expect(outputs).toEqual([createMessage()]);
  });
});
