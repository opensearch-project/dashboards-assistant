/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DynamicTool } from 'langchain/tools';
import { SavedObjectAttributes } from '../../../../../../src/core/types';
import { jsonToCsv, swallowErrors } from '../../utils/utils';
import { PluginToolsFactory } from '../tools_factory/tools_factory';

export class SavedObjectsTools extends PluginToolsFactory {
  static TOOL_NAMES = {
    FIND_VISUALIZATIONS: 'Find Visualizations',
  } as const;

  toolsList = [
    new DynamicTool({
      name: SavedObjectsTools.TOOL_NAMES.FIND_VISUALIZATIONS,
      description:
        'use this tool to find user created visualizations. This tool takes the visualization name as input and returns the first 3 matching visualizations',
      func: swallowErrors((name: string) => this.findVisualizationsByName(name)), // use arrow function to pass through `this`
      callbacks: this.callbacks,
    }),
  ];

  public async findVisualizationsByName(name: string) {
    const visualizations = await this.savedObjectsClient
      .find<SavedObjectAttributes & { title: string; visState: string }>({
        type: 'visualization', // VISUALIZE_EMBEDDABLE_TYPE
        search: name,
        perPage: 3,
      })
      .then((response) =>
        response.saved_objects.map((visualization) => ({
          id: visualization.id,
          title: visualization.attributes.title,
        }))
      );
    return jsonToCsv(visualizations);
  }
}
