/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LangchainTrace } from '../../../../../common/utils/llm_chat/traces';
import { SavedObjectsTools } from '../../../tools/tool_sets/saved_objects';
import { buildCoreVisualizations } from '../saved_objects';
import { createTrace } from '../../../__tests__/__utils__/test_helpers';

describe('build saved objects', () => {
  it('builds visualizations', () => {
    const traces: LangchainTrace[] = [
      createTrace({
        type: 'tool',
        name: SavedObjectsTools.TOOL_NAMES.FIND_VISUALIZATIONS,
        output:
          'row_number,id,title\n' +
          '1,id1,[Flights] Total Flights\n' +
          '2,id2,[Flights] Controls\n' +
          '3,id3,[Flights] Airline Carrier',
      }),
    ];
    const outputs = buildCoreVisualizations(traces, []);
    expect(outputs).toEqual([
      {
        content: 'id1',
        contentType: 'visualization',
        suggestedActions: [{ actionType: 'view_in_dashboards', message: 'View in Visualize' }],
        type: 'output',
      },
      {
        content: 'id2',
        contentType: 'visualization',
        suggestedActions: [{ actionType: 'view_in_dashboards', message: 'View in Visualize' }],
        type: 'output',
      },
      {
        content: 'id3',
        contentType: 'visualization',
        suggestedActions: [{ actionType: 'view_in_dashboards', message: 'View in Visualize' }],
        type: 'output',
      },
    ]);
  });
});
