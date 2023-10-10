/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LangchainTrace } from '../../../../../common/utils/llm_chat/traces';
import { PPLTools } from '../../../tools/tool_sets/ppl';
import { createMessage, createTrace } from '../../../__tests__/__utils__/test_helpers';
import { buildPPLOutputs } from '../ppl';

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
