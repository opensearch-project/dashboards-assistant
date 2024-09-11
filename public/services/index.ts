/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createGetterSetter } from '../../../../src/plugins/opensearch_dashboards_utils/public';
import { UiActionsSetup, UiActionsStart } from '../../../../src/plugins/ui_actions/public';
import { ChromeStart, HttpStart, NotificationsStart } from '../../../../src/core/public';
import { IncontextInsightRegistry } from './incontext_insight';
import { ConfigSchema } from '../../common/types/config';
import { IndexPatternsContract } from '../../../../src/plugins/data/public';
import { ExpressionsStart } from '../../../../src/plugins/expressions/public';

export * from './incontext_insight';
export { ConversationLoadService } from './conversation_load_service';
export { ConversationsService } from './conversations_service';

export const [getIncontextInsightRegistry, setIncontextInsightRegistry] = createGetterSetter<
  IncontextInsightRegistry
>('IncontextInsightRegistry');

export const [getChrome, setChrome] = createGetterSetter<ChromeStart>('Chrome');

export const [getNotifications, setNotifications] = createGetterSetter<NotificationsStart>(
  'Notifications'
);

export const [getConfigSchema, setConfigSchema] = createGetterSetter<ConfigSchema>('ConfigSchema');

export const [getUiActions, setUiActions] = createGetterSetter<UiActionsStart>('uiActions');

export const [getIndexPatterns, setIndexPatterns] = createGetterSetter<IndexPatternsContract>(
  'IndexPatterns'
);

export const [getExpressions, setExpressions] = createGetterSetter<ExpressionsStart>('Expressions');

export const [getHttp, setHttp] = createGetterSetter<HttpStart>('Http');

export { DataSourceService, DataSourceServiceContract } from './data_source_service';
