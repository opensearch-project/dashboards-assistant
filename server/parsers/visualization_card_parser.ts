/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IMessage, Interaction } from '../../common/types/chat_saved_object_attributes';
import { getJsonFromString } from '../utils/csv-parser-helper';

const extractNthColumn = async (csv: string, column: number) => {
  const lines = (await getJsonFromString(csv)) as Array<{ Id: string }>;
  return lines
    .map((line) => line.Id)
    .filter(<T>(v: T | null | undefined): v is T => v !== null && v !== undefined);
};

export const VisualizationCardParser = {
  id: 'core_visualization',
  async parserProvider(interaction: Interaction) {
    const additionalInfo = interaction.additional_info as {
      'VisualizationTool.output': string[];
    } | null;
    const visualizationOutputs = additionalInfo?.['VisualizationTool.output'];
    if (!visualizationOutputs) {
      return [];
    }
    const visualizationIds = (
      await Promise.all(visualizationOutputs.map((output) => extractNthColumn(output, 1)))
    ).flatMap((id) => id); // second column is id field

    const visOutputs: IMessage[] = visualizationIds
      /**
       * Empty id will be filtered
       */
      .filter((id) => id)
      .map((id) => ({
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
