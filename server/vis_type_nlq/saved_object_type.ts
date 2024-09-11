/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VIS_NLQ_SAVED_OBJECT } from '../../common/constants/vis_type_nlq';
import { SavedObject, SavedObjectsType } from '../../../../src/core/server';
import { SavedObjectAttributes } from '../../../../src/core/types';

export interface VisNLQSavedObjectAttributes extends SavedObjectAttributes {
  title: string;
  description?: string;
  visualizationState?: string;
  updated_at?: string;
  uiState?: string;
  version: number;
  searchSourceFields?: {
    index?: string;
  };
}

export const visNLQSavedObjectType: SavedObjectsType = {
  name: VIS_NLQ_SAVED_OBJECT,
  hidden: false,
  namespaceType: 'single',
  management: {
    defaultSearchField: 'title',
    importableAndExportable: true,
    getTitle: ({ attributes: { title } }: SavedObject<VisNLQSavedObjectAttributes>) => title,
    getInAppUrl({ id }: SavedObject) {
      return {
        path: `/app/text2viz/edit/${encodeURIComponent(id)}`,
        uiCapabilitiesPath: `${VIS_NLQ_SAVED_OBJECT}.show`,
      };
    },
  },
  migrations: {},
  mappings: {
    properties: {
      title: {
        type: 'text',
      },
      description: {
        type: 'text',
      },
      visualizationState: {
        type: 'text',
        index: false,
      },
      uiState: {
        type: 'text',
        index: false,
      },
      version: { type: 'integer' },
      kibanaSavedObjectMeta: {
        properties: { searchSourceJSON: { type: 'text', index: false } },
      },
    },
  },
};
