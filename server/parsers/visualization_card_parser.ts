/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IMessage, Interaction } from '../../common/types/chat_saved_object_attributes';
import { getJsonFromString } from '../utils/csv-parser-helper';

const extractIdsFromCsvString = async (csv: string) => {
  const lines = (await getJsonFromString(csv)) as Array<{ Id: string }>;
  return lines
    .map((line) => line.Id)
    .filter(<T>(v: T | null | undefined): v is T => v !== null && v !== undefined);
};

export const VisualizationCardParser = {
  id: 'core_visualization',
  async parserProvider(interaction: Interaction) {
    const visualizationOutputs = interaction.additional_info?.['VisualizationTool.output'] as
      | string[]
      | undefined;
    if (!visualizationOutputs) {
      return [];
    }
    const visualizationIds = (
      await Promise.all(visualizationOutputs.map((output) => extractIdsFromCsvString(output)))
    ).flatMap((id) => id);

    const visOutputs: IMessage[] = [...new Set(visualizationIds)]
      /**
       * Empty id will be filtered
       */
      .filter((id) => id)
      .map((id) => ({
        type: 'output',
        content: id,
        contentType: 'visualization',
        isVisualization: true,
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
