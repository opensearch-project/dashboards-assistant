/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoreSetup, CoreStart, Plugin } from '../../../src/core/public';
import { toMountPoint } from '../../../src/plugins/opensearch_dashboards_react/public';
import { CoreServicesContext, HeaderChatButton } from './components/llm_chat/chat_header_button';
import { coreRefs } from './framework/core_refs';
import {
  AppPluginStartDependencies,
  AssistantSetup,
  AssistantStart,
  SetupDependencies,
} from './types';

export class AssistantPlugin
  implements Plugin<AssistantSetup, AssistantStart, SetupDependencies, AppPluginStartDependencies>
{
  public setup(
    core: CoreSetup<AppPluginStartDependencies>,
    setupDeps: SetupDependencies
  ): AssistantSetup {
    // Return methods that should be available to other plugins
    return {};
  }

  public start(core: CoreStart, startDeps: AppPluginStartDependencies): AssistantStart {
    coreRefs.core = core;
    core.http
      .get<{ data: { roles: string[] } }>('/api/v1/configuration/account')
      .then((res) => res.data.roles.some((role) => ['all_access', 'assistant_user'].includes(role)))
      .then((chatEnabled) => {
        coreRefs.llm_enabled = chatEnabled;
        core.chrome.navControls.registerRight({
          order: 10000,
          mount: toMountPoint(
            <CoreServicesContext.Provider
              value={{
                core,
                http: core.http,
                savedObjectsClient: core.savedObjects.client,
                DashboardContainerByValueRenderer:
                  startDeps.dashboard.DashboardContainerByValueRenderer,
              }}
            >
              <HeaderChatButton application={core.application} chatEnabled={chatEnabled} />
            </CoreServicesContext.Provider>
          ),
        });
      });

    coreRefs.http = core.http;
    coreRefs.savedObjectsClient = core.savedObjects.client;
    coreRefs.toasts = core.notifications.toasts;

    return {};
  }

  public stop() {}
}
