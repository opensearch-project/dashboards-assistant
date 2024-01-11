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
import { ConversationLoadService } from './services/coversation_load_service';
import { ConversationsService } from './services/conversations_service';
import {
  ActionExecutor,
  AppPluginStartDependencies,
  AssistantActions,
  AssistantSetup,
  AssistantStart,
  MessageRenderer,
  SetupDependencies,
} from './types';

export const [getCoreStart, setCoreStart] = createGetterSetter<CoreStart>('CoreStart');

interface PublicConfig {
  chat: {
    // whether chat feature is enabled, UI should hide if false
    enabled: boolean;
    rootAgentName?: string;
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
    const messageRenderers: Record<string, MessageRenderer> = {};
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

    if (this.config.chat.enabled) {
      core.getStartServices().then(async ([coreStart, startDeps]) => {
        const CoreContext = createOpenSearchDashboardsReactContext<AssistantServices>({
          ...coreStart,
          setupDeps,
          startDeps,
          conversationLoad: new ConversationLoadService(coreStart.http),
          conversations: new ConversationsService(coreStart.http),
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
                messageRenderers={messageRenderers}
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
      registerMessageRenderer: (contentType, render) => {
        if (contentType in messageRenderers)
          console.warn(`Content renderer type ${contentType} is already registered.`);
        messageRenderers[contentType] = render;
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
