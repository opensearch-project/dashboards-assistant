/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from '../../../../src/core/public';
import { SavedObjectService } from './saved_object_service';

export class SavedObjectManager {
  private static instances: Map<string, SavedObjectService<{}>> = new Map();
  private constructor() {}

  public static getInstance<T extends {}>(
    savedObjectsClient: SavedObjectsClientContract,
    savedObjectType: string
  ) {
    if (!SavedObjectManager.instances.has(savedObjectType)) {
      SavedObjectManager.instances.set(
        savedObjectType,
        new SavedObjectService<T>(savedObjectsClient, savedObjectType)
      );
    }
    return SavedObjectManager.instances.get(savedObjectType) as SavedObjectService<T>;
  }
}
