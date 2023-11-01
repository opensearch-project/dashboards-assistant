/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsType } from '../../../../src/core/server';
import { CHAT_CONFIG_SAVED_OBJECT_TYPE } from '../../common/constants/saved_objects';

export const chatConfigSavedObject: SavedObjectsType = {
  name: CHAT_CONFIG_SAVED_OBJECT_TYPE,
  hidden: false,
  namespaceType: 'agnostic',
  mappings: {
    dynamic: false,
    properties: {
      terms_accepted: {
        type: 'boolean',
      },
    },
  },
};
