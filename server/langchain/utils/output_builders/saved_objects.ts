/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IMessage } from '../../../../common/types/chat_saved_object_attributes';
import { LangchainTrace } from '../../../../common/utils/llm_chat/traces';
import { SavedObjectsTools } from '../../tools/tool_sets/saved_objects';
import { filterToolOutput } from './utils';

// TODO use a more robust CSV parsing library
const extractNthColumn = (csv: string, column: number) => {
  const lines = csv.split(/\r?\n/).slice(1);
  return lines
    .map((line) => line.split(',').at(column))
    .filter(<T>(v: T | null | undefined): v is T => v !== null && v !== undefined);
};

export const buildCoreVisualizations = (traces: LangchainTrace[], outputs: IMessage[]) => {
  const visualizationIds = traces
    .filter(filterToolOutput(SavedObjectsTools.TOOL_NAMES.FIND_VISUALIZATIONS))
    .flatMap((trace) => extractNthColumn(trace.output, 1)); // second column is id field

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

  return outputs.concat(visOutputs);
};
