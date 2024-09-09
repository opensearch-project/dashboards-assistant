/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiLoadingSpinner } from '@elastic/eui';
import React, { lazy, Suspense } from 'react';
import { of, Subscription } from 'rxjs';
import {
  AppMountParameters,
  AppNavLinkStatus,
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
} from '../../../src/core/public';
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
  setIndexPatterns,
  setIncontextInsightRegistry,
  setConfigSchema,
  setUiActions,
  setExpressions,
  setHttp,
} from './services';
import { ConfigSchema } from '../common/types/config';
import { DataSourceService } from './services/data_source_service';
import { ASSISTANT_API, DEFAULT_USER_NAME } from '../common/constants/llm';
import { IncontextInsightProps } from './components/incontext_insight';
import { AssistantService } from './services/assistant_service';
import { ActionContextMenu } from './components/ui_action_context_menu';
import { AI_ASSISTANT_QUERY_EDITOR_TRIGGER, bootstrap } from './ui_triggers';
import { TEXT2VIZ_APP_ID } from './text2viz';
import { VIS_NLQ_APP_ID, VIS_NLQ_SAVED_OBJECT } from '../common/constants/vis_type_nlq';
import {
  createVisNLQSavedObjectLoader,
  setVisNLQSavedObjectLoader,
} from './vis_nlq/saved_object_loader';
import { NLQVisualizationEmbeddableFactory } from './components/visualization/embeddable/nlq_vis_embeddable_factory';
import { NLQ_VISUALIZATION_EMBEDDABLE_TYPE } from './components/visualization/embeddable/nlq_vis_embeddable';

export const [getCoreStart, setCoreStart] = createGetterSetter<CoreStart>('CoreStart');

// @ts-ignore
const LazyIncontextInsightComponent = lazy(() => import('./components/incontext_insight'));

export const IncontextInsightComponent: React.FC<{ props: IncontextInsightProps }> = (props) => (
  <Suspense fallback={<EuiLoadingSpinner />}>
    <LazyIncontextInsightComponent {...props} />
  </Suspense>
);

interface UserAccountResponse {
  user_name: string;
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
  private assistantService = new AssistantService();

  constructor(initializerContext: PluginInitializerContext) {
    this.config = initializerContext.config.get<ConfigSchema>();
    this.dataSourceService = new DataSourceService();
  }

  public setup(
    core: CoreSetup<AssistantPluginStartDependencies>,
    setupDeps: AssistantPluginSetupDependencies
  ): AssistantSetup {
    this.assistantService.setup();
    this.incontextInsightRegistry = new IncontextInsightRegistry();
    this.incontextInsightRegistry?.setIsEnabled(this.config.incontextInsight.enabled);
    setIncontextInsightRegistry(this.incontextInsightRegistry);
    const messageRenderers: Record<string, MessageRenderer> = {};
    const actionExecutors: Record<string, ActionExecutor> = {};
    const assistantActions: AssistantActions = {} as AssistantActions;
    /**
     * Returns {@link UserAccountResponse}. Provides user name.
     */
    const getAccount: () => Promise<UserAccountResponse> = async () => {
      const account = await core.http.get<UserAccountResponse>(ASSISTANT_API.ACCOUNT).catch((e) => {
        console.error(`Failed to request user account information: ${String(e.body || e)}`);
        return { user_name: DEFAULT_USER_NAME };
      });
      return account;
    };

    // setup ui trigger
    bootstrap(setupDeps.uiActions);

    const dataSourceSetupResult = this.dataSourceService.setup({
      uiSettings: core.uiSettings,
      dataSourceManagement: setupDeps.dataSourceManagement,
    });

    if (this.config.text2viz.enabled) {
      setupDeps.embeddable.registerEmbeddableFactory(
        NLQ_VISUALIZATION_EMBEDDABLE_TYPE,
        new NLQVisualizationEmbeddableFactory()
      );

      setupDeps.visualizations.registerAlias({
        name: 'text2viz',
        aliasPath: '#/',
        aliasApp: VIS_NLQ_APP_ID,
        title: i18n.translate('dashboardAssistant.feature.text2viz.title', {
          defaultMessage: 'Natural language',
        }),
        description: i18n.translate('dashboardAssistant.feature.text2viz.description', {
          defaultMessage: 'Generate visualization with a natural language question.',
        }),
        icon: 'chatRight',
        stage: 'experimental',
        promotion: {
          buttonText: i18n.translate('dashboardAssistant.feature.text2viz.promotion.buttonText', {
            defaultMessage: 'Natural language previewer',
          }),
          description: i18n.translate('dashboardAssistant.feature.text2viz.promotion.description', {
            defaultMessage:
              'Not sure which visualization to choose? Generate visualization previews with a natural language question.',
          }),
        },
        appExtensions: {
          visualizations: {
            docTypes: [VIS_NLQ_SAVED_OBJECT],
            toListItem: ({ id, attributes, updated_at: updatedAt }) => ({
              description: attributes?.description,
              editApp: VIS_NLQ_APP_ID,
              editUrl: `/edit/${encodeURIComponent(id)}`,
              icon: 'chatRight',
              id,
              savedObjectType: VIS_NLQ_SAVED_OBJECT,
              title: attributes?.title,
              typeTitle: 'NLQ',
              updated_at: updatedAt,
              stage: 'experimental',
            }),
          },
        },
      });

      core.application.register({
        id: TEXT2VIZ_APP_ID,
        title: i18n.translate('dashboardAssistant.feature.text2viz', {
          defaultMessage: 'Natural language previewer',
        }),
        navLinkStatus: AppNavLinkStatus.hidden,
        mount: async (params: AppMountParameters) => {
          const [coreStart, pluginsStart] = await core.getStartServices();
          params.element.classList.add('text2viz-wrapper');
          const { renderText2VizApp } = await import('./text2viz');
          const unmount = renderText2VizApp(params, {
            ...coreStart,
            ...pluginsStart,
            setHeaderActionMenu: params.setHeaderActionMenu,
          });

          return () => {
            unmount();
            params.element.classList.remove('text2viz-wrapper');
          };
        },
      });
    }

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
        const username = account.user_name;

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
                messageRenderers={messageRenderers}
                actionExecutors={actionExecutors}
                assistantActions={assistantActions}
                currentAccount={{ username }}
              />
            </CoreContext.Provider>
          ),
        });
      };
      setupChat();
    }

    setupDeps.data.__enhance({
      editor: {
        queryEditorExtension: {
          id: 'assistant-query-actions',
          order: 2000,
          isEnabled$: () => of(true),
          getComponent: () => {
            return <ActionContextMenu />;
          },
        },
      },
    });

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
      nextEnabled: () => this.config.next.enabled,
      getFeatureStatus: () => ({
        chat: this.config.chat.enabled,
        next: this.config.next.enabled,
        text2viz: this.config.text2viz.enabled,
        alertInsight: this.config.alertInsight.enabled,
        smartAnomalyDetector: this.config.smartAnomalyDetector.enabled,
      }),
      assistantActions,
      assistantTriggers: {
        AI_ASSISTANT_QUERY_EDITOR_TRIGGER,
      },
      registerIncontextInsight: this.incontextInsightRegistry.register.bind(
        this.incontextInsightRegistry
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderIncontextInsight: (props: any) => {
        if (!this.incontextInsightRegistry?.isEnabled()) return <div {...props} />;
        const httpSetup = core.http;
        return <IncontextInsightComponent {...props} httpSetup={httpSetup} />;
      },
    };
  }

  public start(
    core: CoreStart,
    { data, expressions, uiActions }: AssistantPluginStartDependencies
  ): AssistantStart {
    const assistantServiceStart = this.assistantService.start(core.http);
    setCoreStart(core);
    setChrome(core.chrome);
    setNotifications(core.notifications);
    setConfigSchema(this.config);
    setUiActions(uiActions);

    if (this.config.text2viz.enabled) {
      uiActions.addTriggerAction(AI_ASSISTANT_QUERY_EDITOR_TRIGGER, {
        id: 'assistant_generate_visualization_action',
        order: 1,
        getDisplayName: () => 'Generate visualization',
        getIconType: () => 'visLine' as const,
        execute: async () => {
          core.application.navigateToApp(TEXT2VIZ_APP_ID);
        },
      });
      const savedVisNLQLoader = createVisNLQSavedObjectLoader({
        savedObjectsClient: core.savedObjects.client,
        indexPatterns: data.indexPatterns,
        search: data.search,
        chrome: core.chrome,
        overlays: core.overlays,
      });
      setVisNLQSavedObjectLoader(savedVisNLQLoader);
    }

    setIndexPatterns(data.indexPatterns);
    setExpressions(expressions);
    setHttp(core.http);

    return {
      dataSource: this.dataSourceService.start(),
      assistantClient: assistantServiceStart.client,
    };
  }

  public stop() {
    this.dataSourceService.stop();
    this.assistantService.stop();
    this.resetChatSubscription?.unsubscribe();
  }
}
