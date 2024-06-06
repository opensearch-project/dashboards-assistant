/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiLoadingSpinner } from '@elastic/eui';
import React, { lazy, Suspense } from 'react';
import { Subscription } from 'rxjs';
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
  AssistantPluginStartDependencies,
  AssistantPluginSetupDependencies,
  AssistantActions,
  AssistantSetup,
  AssistantStart,
  MessageRenderer,
} from './types';
import {
  IncontextInsightRegistry,
  ConversationLoadService,
  ConversationsService,
  setChrome,
  setNotifications,
  setIncontextInsightRegistry,
} from './services';
import { ConfigSchema } from '../common/types/config';
import { DataSourceService } from './services/data_source_service';

export const [getCoreStart, setCoreStart] = createGetterSetter<CoreStart>('CoreStart');

// @ts-ignore
const LazyIncontextInsightComponent = lazy(() => import('./components/incontext_insight'));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const IncontextInsightComponent: React.FC<{ props: any }> = (props) => (
  <Suspense fallback={<EuiLoadingSpinner />}>
    <LazyIncontextInsightComponent {...props} />
  </Suspense>
);

interface UserAccountResponse {
  data: { roles: string[]; user_name: string; user_requested_tenant?: string };
}

export class AssistantPlugin
  implements
    Plugin<
      AssistantSetup,
      AssistantStart,
      AssistantPluginSetupDependencies,
      AssistantPluginStartDependencies
    > {
  private config: ConfigSchema;
  incontextInsightRegistry: IncontextInsightRegistry | undefined;
  private dataSourceService: DataSourceService;
  private resetChatSubscription: Subscription | undefined;

  constructor(initializerContext: PluginInitializerContext) {
    this.config = initializerContext.config.get<ConfigSchema>();
    this.dataSourceService = new DataSourceService();
  }

  public setup(
    core: CoreSetup<AssistantPluginStartDependencies>,
    setupDeps: AssistantPluginSetupDependencies
  ): AssistantSetup {
    this.incontextInsightRegistry = new IncontextInsightRegistry();
    setIncontextInsightRegistry(this.incontextInsightRegistry);
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

    const dataSourceSetupResult = this.dataSourceService.setup({
      uiSettings: core.uiSettings,
      dataSourceManagement: setupDeps.dataSourceManagement,
    });

    if (this.config.chat.enabled) {
      const setupChat = async () => {
        const [coreStart, startDeps] = await core.getStartServices();

        const CoreContext = createOpenSearchDashboardsReactContext<AssistantServices>({
          ...coreStart,
          setupDeps,
          startDeps,
          conversationLoad: new ConversationLoadService(coreStart.http, this.dataSourceService),
          conversations: new ConversationsService(coreStart.http, this.dataSourceService),
          dataSource: this.dataSourceService,
        });
        const account = await getAccount();
        const username = account.data.user_name;
        const tenant = account.data.user_requested_tenant ?? '';
        this.incontextInsightRegistry?.setIsEnabled(this.config.incontextInsight.enabled);

        if (this.dataSourceService.isMDSEnabled()) {
          this.resetChatSubscription = this.dataSourceService.dataSourceIdUpdates$.subscribe(() => {
            assistantActions.resetChat?.();
          });
        }

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
      };
      setupChat();
    }

    return {
      dataSource: dataSourceSetupResult,
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
      registerIncontextInsight: this.incontextInsightRegistry.register.bind(
        this.incontextInsightRegistry
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderIncontextInsight: (props: any) => {
        if (!this.incontextInsightRegistry?.isEnabled()) return <div {...props} />;
        return <IncontextInsightComponent {...props} />;
      },
    };
  }

  public start(core: CoreStart): AssistantStart {
    setCoreStart(core);
    setChrome(core.chrome);
    setNotifications(core.notifications);

    return {
      dataSource: this.dataSourceService.start(),
    };
  }

  public stop() {
    this.dataSourceService.stop();
    this.resetChatSubscription?.unsubscribe();
  }
}
