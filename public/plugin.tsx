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
  ActionExecutor,
  AppPluginStartDependencies,
  AssistantSetup,
  AssistantStart,
  ContentRenderer,
  SetupDependencies,
} from './types';

export class AssistantPlugin
  implements Plugin<AssistantSetup, AssistantStart, SetupDependencies, AppPluginStartDependencies> {
  public setup(
    core: CoreSetup<AppPluginStartDependencies>,
    setupDeps: SetupDependencies
  ): AssistantSetup {
    const contentRenderers: Record<string, ContentRenderer> = {};
    const actionExecutors: Record<string, ActionExecutor> = {};

    core.getStartServices().then(([coreStart, startDeps]) => {
      coreStart.http
        .get<{ data: { roles: string[] } }>('/api/v1/configuration/account')
        .then((res) =>
          res.data.roles.some((role) => ['all_access', 'assistant_user'].includes(role))
        )
        .then((chatEnabled) => {
          coreRefs.llm_enabled = chatEnabled;
          coreStart.chrome.navControls.registerRight({
            order: 10000,
            mount: toMountPoint(
              <CoreServicesContext.Provider
                value={{
                  core: coreStart,
                  http: coreStart.http,
                  savedObjectsClient: coreStart.savedObjects.client,
                  DashboardContainerByValueRenderer:
                    startDeps.dashboard.DashboardContainerByValueRenderer,
                }}
              >
                <HeaderChatButton
                  application={coreStart.application}
                  chatEnabled={chatEnabled}
                  contentRenderers={contentRenderers}
                  actionExecutors={actionExecutors}
                />
              </CoreServicesContext.Provider>
            ),
          });
        });
    });

    return {
      registerContentRenderer: (contentType, render) => {
        if (contentType in contentRenderers)
          console.warn(`Content renderer type ${contentType} is already registered.`);
        contentRenderers[contentType] = render;
      },
      registerActionExecutor: (actionType, execute) => {
        if (actionType in actionExecutors)
          console.warn(`Action executor type ${actionType} is already registered.`);
        actionExecutors[actionType] = execute;
      },
    };
  }

  public start(core: CoreStart, startDeps: AppPluginStartDependencies): AssistantStart {
    coreRefs.core = core;
    coreRefs.http = core.http;
    coreRefs.savedObjectsClient = core.savedObjects.client;
    coreRefs.toasts = core.notifications.toasts;

    return {};
  }

  public stop() {}
}
