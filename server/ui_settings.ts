/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { schema } from '@osd/config-schema';

import { UiSettingsParams } from 'opensearch-dashboards/server';
import { INCONTEXT_INSIGHT_INITIAL_ONLOAD_TIME_SETTING } from '../common/constants';

export const uiSettings: Record<string, UiSettingsParams> = {
  [INCONTEXT_INSIGHT_INITIAL_ONLOAD_TIME_SETTING]: {
    name: i18n.translate('assistantDashboards.advancedSettings.incontextInsightInitialOnloadTime', {
      defaultMessage: 'Incontext insight initial onload time',
    }),
    value: 10000,
    description: i18n.translate(
      'assistantDashboards.advancedSettings.incontextInsightInitialOnloadTimeText',
      {
        defaultMessage:
          'The time in milliseconds for the initial onload state for incontext insights where the user sees the chat icon. ' +
          'Setting to a negative value will completely disable incontext insights.',
      }
    ),
    requiresPageReload: true,
    category: ['assistant'],
    schema: schema.number(),
  },
};
