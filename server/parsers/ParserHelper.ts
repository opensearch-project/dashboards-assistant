/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Qs from 'querystring';
import {
  IAdditionalAction,
  IMessage,
  Interaction,
} from '../../common/types/chat_saved_object_attributes';

/*
 * Add additional actions following the basic output in the same message bubble.
 * Currently, only CreateAlertTool.output will add additional action, may be extended in the future.
 */
export const parseAdditionalActions = (interaction: Interaction): IAdditionalAction[] => {
  const monitorParameters =
    (interaction.additional_info?.['CreateAlertTool.output'] as string[] | null)?.map(
      (item: string): {} => {
        // @typescript-eslint/no-explicit-any
        let parameters: { [key: string]: string } = {};
        try {
          const parsedItem = JSON.parse(item);
          parameters.name = parsedItem.name;
          if (parsedItem.search) {
            parameters.index = parsedItem.search.indices;
            parameters.timeField = parsedItem.search.timeField;
            parameters.bucketValue = parsedItem.search.bucketValue;
            parameters.bucketUnitOfTime = parsedItem.search.bucketUnitOfTime;
            parameters.filters = JSON.stringify(parsedItem.search.filters);
            parameters.aggregations = JSON.stringify(parsedItem.search.aggregations);
          }
          parameters.triggers = JSON.stringify(parsedItem.triggers);
        } catch (e) {
          parameters = {};
        }

        return parameters;
      }
    ) || [];

  if (!monitorParameters.length) return [];

  return monitorParameters
    .filter((parameters) => parameters)
    .map((parameters) => ({
      actionType: 'create_alert_button',
      message: 'Create Alert',
      content: Qs.stringify(parameters),
    }));
};
