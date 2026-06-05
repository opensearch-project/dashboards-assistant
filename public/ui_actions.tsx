/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { AssistantService } from './services/assistant_service';
import { CoreSetup } from '../../../src/core/public';
import { DataPublicPluginSetup } from '../../../src/plugins/data/public';
import { TEXT2DASH_APP_ID } from './text2dash';
import { DashboardSetup } from '../../../src/plugins/dashboard/public';

interface Services {
  core: CoreSetup;
  data: DataPublicPluginSetup;
  dashboard: DashboardSetup;
  assistantService: AssistantService;
}

export function registerGenerateDashboardUIAction(services: Services) {
  const { core, dashboard } = services;

  dashboard.registerDashboardProvider({
    savedObjectsType: 'text2dash',
    savedObjectsName: 'Text2dash',
    appId: TEXT2DASH_APP_ID,
    viewUrlPathFn: (obj) => {
      return `#/view/${obj.id}`;
    },
    editUrlPathFn: (obj) => {
      return `/view/${obj.id}?_a=(viewMode:edit)`;
    },
    createUrl: core.http.basePath.prepend(`/app/${TEXT2DASH_APP_ID}#/`),
    createSortText: 'Text2dash',
    createLinkText: (
      <FormattedMessage
        id="dashboardAssistant.tableListView.listing.createNewItemButtonLabel"
        defaultMessage="{entityName}"
        values={{ entityName: 'AI generate' }}
      />
    ),
  });
}
