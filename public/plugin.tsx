/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoreSetup, CoreStart, Plugin } from '../../../src/core/public';
import {
  createOpenSearchDashboardsReactContext,
  toMountPoint,
} from '../../../src/plugins/opensearch_dashboards_react/public';
import { createGetterSetter } from '../../../src/plugins/opensearch_dashboards_utils/common';
import { HeaderChatButton } from './chat_header_button';
import { AssistantServices } from './contexts/core_context';
import {
  ActionExecutor,
  AppPluginStartDependencies,
  AssistantSetup,
  AssistantStart,
  ContentRenderer,
  SetupDependencies,
} from './types';

export const [getCoreStart, setCoreStart] = createGetterSetter<CoreStart>('CoreStart');

export class AssistantPlugin
  implements Plugin<AssistantSetup, AssistantStart, SetupDependencies, AppPluginStartDependencies> {
  public setup(
    core: CoreSetup<AppPluginStartDependencies>,
    setupDeps: SetupDependencies
  ): AssistantSetup {
    const contentRenderers: Record<string, ContentRenderer> = {};
    const actionExecutors: Record<string, ActionExecutor> = {};
    const assistantEnabled = (() => {
      let enabled: boolean;
      return async (): Promise<boolean> => {
        if (enabled === undefined) {
          enabled = await core.http
            .get<{ data: { roles: string[] } }>('/api/v1/configuration/account')
            .then((res) =>
              res.data.roles.some((role) => ['all_access', 'assistant_user'].includes(role))
            );
        }
        return enabled;
      };
    })();

    core.getStartServices().then(async ([coreStart, startDeps]) => {
      const CoreContext = createOpenSearchDashboardsReactContext<AssistantServices>({
        ...coreStart,
        setupDeps,
        startDeps,
      });
      coreStart.chrome.navControls.registerRight({
        order: 10000,
        mount: toMountPoint(
          <CoreContext.Provider>
            <HeaderChatButton
              application={coreStart.application}
              chatEnabled={await assistantEnabled()}
              contentRenderers={contentRenderers}
              actionExecutors={actionExecutors}
            />
          </CoreContext.Provider>
        ),
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
      assistantEnabled,
    };
  }

  public start(core: CoreStart, startDeps: AppPluginStartDependencies): AssistantStart {
    setCoreStart(core);

    return {};
  }

  public stop() {}
}
