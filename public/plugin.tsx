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
import {
  ActionExecutor,
  AppPluginStartDependencies,
  AssistantActions,
  AssistantSetup,
  AssistantStart,
  ContentRenderer,
  SetupDependencies,
} from './types';
import { ConversationLoadService } from './services/conversation_load_service';
import { ConversationsService } from './services/conversations_service';

export const [getCoreStart, setCoreStart] = createGetterSetter<CoreStart>('CoreStart');

interface PublicConfig {
  chat: {
    enabled: boolean;
  };
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
    const getAccount = async () => {
      return await core.http.get<{
        data: { roles: string[]; user_name: string; user_requested_tenant: string | null };
      }>('/api/v1/configuration/account');
    };
    const assistantEnabled = (() => {
      let enabled: boolean;
      return async () => {
        if (enabled === undefined) {
          const account = await getAccount();
          enabled = account.data.roles.some((role) =>
            ['all_access', 'assistant_user'].includes(role)
          );
        }
        return enabled;
      };
    })();

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
                chatEnabled={account.data.roles.some((role) =>
                  ['all_access', 'assistant_user'].includes(role)
                )}
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
      assistantEnabled,
      assistantActions,
    };
  }

  public start(core: CoreStart, startDeps: AppPluginStartDependencies): AssistantStart {
    setCoreStart(core);

    return {};
  }

  public stop() {}
}
