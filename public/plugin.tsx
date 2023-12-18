/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoreSetup, CoreStart, Plugin, PluginInitializerContext } from '../../../src/core/public';
import {
  createOpenSearchDashboardsReactContext,
  toMountPoint,
} from '../../../src/plugins/opensearch_dashboards_react/public';
import { createGetterSetter } from '../../../src/plugins/opensearch_dashboards_utils/common';
import { HeaderChatButton } from './chat_header_button';
import { AssistantServices } from './contexts/core_context';
import { SessionLoadService } from './services/session_load_service';
import { SessionsService } from './services/sessions_service';
import {
  ActionExecutor,
  AppPluginStartDependencies,
  AssistantActions,
  AssistantSetup,
  AssistantStart,
  ContentRenderer,
  SetupDependencies,
} from './types';

export const [getCoreStart, setCoreStart] = createGetterSetter<CoreStart>('CoreStart');

interface PublicConfig {
  chat: {
    // whether chat feature is enabled, UI should hide if false
    enabled: boolean;
    rootAgentId?: string;
  };
}

interface UserAccountResponse {
  data: { roles: string[]; user_name: string; user_requested_tenant?: string };
}

export class AssistantPlugin
  implements Plugin<AssistantSetup, AssistantStart, SetupDependencies, AppPluginStartDependencies> {
  private config: PublicConfig;
  constructor(initializerContext: PluginInitializerContext) {
    this.config = initializerContext.config.get<PublicConfig>();
  }

  public setup(
    core: CoreSetup<AppPluginStartDependencies>,
    setupDeps: SetupDependencies
  ): AssistantSetup {
    const contentRenderers: Record<string, ContentRenderer> = {};
    const actionExecutors: Record<string, ActionExecutor> = {};
    const assistantActions: AssistantActions = {} as AssistantActions;
    /**
     * Returns {@link UserAccountResponse}. Provides default roles and user
     * name if security plugin call fails.
     */
    const getAccount: () => Promise<UserAccountResponse> = (() => {
      let account: UserAccountResponse;
      return async () => {
        if (setupDeps.securityDashboards === undefined)
          return { data: { roles: ['all_access'], user_name: 'dashboards_user' } };
        if (account === undefined) {
          account = await core.http
            .get<UserAccountResponse>('/api/v1/configuration/account')
            .catch((e) => {
              console.error(`Failed to request user account information: ${String(e.body || e)}`);
              return { data: { roles: [], user_name: '' } };
            });
        }
        return account;
      };
    })();
    const checkAccess = (account: Awaited<ReturnType<typeof getAccount>>) =>
      account.data.roles.some((role) => ['all_access', 'assistant_user'].includes(role));

    if (this.config.chat.enabled && this.config.chat.rootAgentId) {
      core.getStartServices().then(async ([coreStart, startDeps]) => {
        const CoreContext = createOpenSearchDashboardsReactContext<AssistantServices>({
          ...coreStart,
          setupDeps,
          startDeps,
          sessionLoad: new SessionLoadService(coreStart.http),
          sessions: new SessionsService(coreStart.http),
        });
        const account = await getAccount();
        const username = account.data.user_name;
        const tenant = account.data.user_requested_tenant ?? '';

        coreStart.chrome.navControls.registerRight({
          order: 10000,
          mount: toMountPoint(
            <CoreContext.Provider>
              <HeaderChatButton
                application={coreStart.application}
                userHasAccess={checkAccess(account)}
                contentRenderers={contentRenderers}
                actionExecutors={actionExecutors}
                assistantActions={assistantActions}
                currentAccount={{ username, tenant }}
              />
            </CoreContext.Provider>
          ),
        });
      });
    }

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
      chatEnabled: () => this.config.chat.enabled,
      userHasAccess: async () => await getAccount().then(checkAccess),
      assistantActions,
    };
  }

  public start(core: CoreStart, startDeps: AppPluginStartDependencies): AssistantStart {
    setCoreStart(core);

    return {};
  }

  public stop() {}
}
