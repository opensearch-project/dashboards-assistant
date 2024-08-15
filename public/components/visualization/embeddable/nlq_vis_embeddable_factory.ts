/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import {
  EmbeddableFactoryDefinition,
  ErrorEmbeddable,
  IContainer,
} from '../../../../../../src/plugins/embeddable/public';
import { VisNLQSavedObject } from '../../../vis_nlq/types';
import { getVisNLQSavedObjectLoader } from '../../../vis_nlq/saved_object_loader';
import { NLQVisualizationInput } from './types';
import {
  NLQ_VISUALIZATION_EMBEDDABLE_TYPE,
  NLQVisualizationEmbeddable,
} from './nlq_vis_embeddable';
import { VIS_NLQ_APP_ID, VIS_NLQ_SAVED_OBJECT } from '../../../../common/constants/vis_type_nlq';
import { SavedObjectMetaData } from '../../../../../../src/plugins/saved_objects/public';
import { getHttp } from '../../../services';

export class NLQVisualizationEmbeddableFactory implements EmbeddableFactoryDefinition {
  public readonly type = NLQ_VISUALIZATION_EMBEDDABLE_TYPE;

  // TODO: it may need control on whether it's editable or not
  public async isEditable() {
    return true;
  }

  public getDisplayName() {
    return i18n.translate('nlq.vis.displayName', {
      defaultMessage: 'Visualization with natural language',
    });
  }

  public readonly savedObjectMetaData: SavedObjectMetaData = {
    name: 'Natural language visualization',
    includeFields: ['visualizationState'],
    type: VIS_NLQ_SAVED_OBJECT,
    getIconForSavedObject: () => 'chatRight',
  };

  public async createFromSavedObject(
    savedObjectId: string,
    input: Partial<NLQVisualizationInput> & { id: string },
    parent?: IContainer
  ): Promise<NLQVisualizationEmbeddable | ErrorEmbeddable> {
    const loader = getVisNLQSavedObjectLoader();
    const editPath = `/edit/${savedObjectId}`;
    const editUrl = getHttp().basePath.prepend(`/app/${VIS_NLQ_APP_ID}${editPath}`);

    try {
      const savedObject: VisNLQSavedObject = await loader.get(savedObjectId);
      return new NLQVisualizationEmbeddable(
        {
          ...input,
          visInput: {
            title: savedObject.title,
            description: savedObject.description,
            visualizationState: savedObject.visualizationState,
            uiState: savedObject.uiState,
            ...input.visInput,
          },
          savedObjectId,
          title: savedObject.title,
        },
        { editUrl, editPath, editable: true },
        parent
      );
    } catch (e) {
      return new ErrorEmbeddable(e, input, parent);
    }
  }

  public async create(input: NLQVisualizationInput, parent?: IContainer) {
    if (input.visInput) {
      const editPath = `/edit/${input.savedObjectId}`;
      const editUrl = getHttp().basePath.prepend(`/app/${VIS_NLQ_APP_ID}${editPath}`);
      return new NLQVisualizationEmbeddable(input, { editUrl, editPath, editable: true }, parent);
    } else {
      return undefined;
    }
  }
}
