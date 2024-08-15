/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createSavedObjectClass,
  SavedObjectLoader,
  SavedObjectOpenSearchDashboardsServices,
} from '../../../../src/plugins/saved_objects/public';
import { SavedObjectReference } from '../../../../src/core/public';
import { injectSearchSourceReferences } from '../../../../src/plugins/data/public';
import { createGetterSetter } from '../../../../src/plugins/opensearch_dashboards_utils/common';
import { VIS_NLQ_APP_ID, VIS_NLQ_SAVED_OBJECT } from '../../common/constants/vis_type_nlq';
import { VisNLQSavedObject } from './types';

export type VisNLQSavedObjectLoader = ReturnType<typeof createVisNLQSavedObjectLoader>;

function injectReferences(savedObject: VisNLQSavedObject, references: SavedObjectReference[]) {
  if (savedObject.searchSourceFields) {
    savedObject.searchSourceFields = injectSearchSourceReferences(
      savedObject.searchSourceFields,
      references
    );
  }
}

function createVisNLQSavedObjectClass(services: SavedObjectOpenSearchDashboardsServices) {
  const SavedObjectClass = createSavedObjectClass(services);

  class VisNLQSavedObjectClass extends SavedObjectClass {
    public static type = VIS_NLQ_SAVED_OBJECT;

    // if type:visualization-nlq has no mapping, we push this mapping into OpenSearch
    public static mapping = {
      title: 'text',
      description: 'text',
      visualizationState: 'text',
      uiState: 'text',
      version: 'integer',
    };

    // Order these fields to the top, the rest are alphabetical
    static fieldOrder = ['title', 'description'];

    // ID is optional, without it one will be generated on save.
    constructor(id: string) {
      super({
        type: VisNLQSavedObjectClass.type,
        mapping: VisNLQSavedObjectClass.mapping,
        injectReferences,

        // if this is null/undefined then the SavedObject will be assigned the defaults
        id,

        // default values that will get assigned if the doc is new
        defaults: {
          title: '',
          description: '',
          visualizationState: '{}',
          uiState: '{}',
          version: 1,
        },
      });
      this.showInRecentlyAccessed = true;
      this.getFullPath = () => `/app/${VIS_NLQ_APP_ID}/edit/${this.id}`;
      this.getOpenSearchType = () => VIS_NLQ_SAVED_OBJECT;
    }
  }

  return VisNLQSavedObjectClass;
}

export const [getVisNLQSavedObjectLoader, setVisNLQSavedObjectLoader] = createGetterSetter<
  VisNLQSavedObjectLoader
>('VisNLQSavedObjectLoader');

export function createVisNLQSavedObjectLoader(services: SavedObjectOpenSearchDashboardsServices) {
  const { savedObjectsClient } = services;
  const savedObjectClass = createVisNLQSavedObjectClass(services);

  return new SavedObjectLoader(savedObjectClass, savedObjectsClient);
}
