/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationCardParser } from './visualization_card_parser';

describe('VisualizationCardParser', () => {
  it('return visualizations when there is VisualizationTool.output', async () => {
    expect(
      await VisualizationCardParser.parserProvider({
        input: 'input',
        response: 'response',
        conversationId: '',
        interactionId: 'interaction_id',
        create_time: '',
        additional_info: {
          'VisualizationTool.output': [
            'row_number,Id,title\n' +
              '1,id1,[Flights] Total Flights\n' +
              '2,id2,[Flights] Controls\n' +
              '3,id3,[Flights] Airline Carrier',
          ],
        },
      })
    ).toEqual([
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

  it('return visualizations when there are multiple VisualizationTool.outputs', async () => {
    expect(
      await VisualizationCardParser.parserProvider({
        input: 'input',
        response: 'response',
        conversationId: '',
        interactionId: 'interaction_id',
        create_time: '',
        additional_info: {
          'VisualizationTool.output': [
            'row_number,Id,title\n' + '1,id1,[Flights] Total Flights\n',
            'row_number,Id,title\n' + '2,id2,[Flights] Controls\n',
          ],
        },
      })
    ).toEqual([
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
    ]);
  });

  it('do not return visualizations when VisualizationTool.output is null', async () => {
    expect(
      await VisualizationCardParser.parserProvider({
        input: 'input',
        response: 'response',
        conversationId: '',
        interactionId: 'interaction_id',
        create_time: '',
        additional_info: {},
      })
    ).toEqual([]);
  });

  it('do not return visualizations when VisualizationTool.output is not in correct format', async () => {
    expect(
      await VisualizationCardParser.parserProvider({
        input: 'input',
        response: 'response',
        conversationId: '',
        interactionId: 'interaction_id',
        create_time: '',
        additional_info: {
          'VisualizationTool.output': [
            'row_number\n' + '1',
            'row_number,Id,title\n' + '2,id2,[Flights] Controls\n',
          ],
        },
      })
    ).toEqual([
      {
        content: 'id2',
        contentType: 'visualization',
        suggestedActions: [{ actionType: 'view_in_dashboards', message: 'View in Visualize' }],
        type: 'output',
      },
    ]);
  });
});
