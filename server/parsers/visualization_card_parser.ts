/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IMessage, Interaction } from '../../common/types/chat_saved_object_attributes';

const extractNthColumn = (csv: string, column: number) => {
  const lines = csv.split(/\r?\n/).slice(1);
  return lines
    .map((line) => line.split(',').at(column))
    .filter(<T>(v: T | null | undefined): v is T => v !== null && v !== undefined);
};

export const VisualizationCardParser = {
  id: 'core_visualization',
  async parserProvider(interaction: Interaction) {
    const additionalInfo = interaction.additional_info as {
      'VisualizationTool.output': string[];
    };
    const visualizationOutputs = additionalInfo?.['VisualizationTool.output'];
    if (!visualizationOutputs) {
      return [];
    }
    const visualizationIds = visualizationOutputs.flatMap((output) => extractNthColumn(output, 1)); // second column is id field

    const visOutputs: IMessage[] = visualizationIds.map((id) => ({
      type: 'output',
      content: id,
      contentType: 'visualization',
      suggestedActions: [
        {
          message: 'View in Visualize',
          actionType: 'view_in_dashboards',
        },
      ],
    }));

    return visOutputs;
  },
};
