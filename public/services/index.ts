/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createGetterSetter } from '../../../../src/plugins/opensearch_dashboards_utils/public';
import { ChromeStart, NotificationsStart } from '../../../../src/core/public';
import { PalantirRegistry } from './palantir';

export * from './palantir';
export { ConversationLoadService } from './conversation_load_service';
export { ConversationsService } from './conversations_service';

export const [getPalantirRegistry, setPalantirRegistry] = createGetterSetter<PalantirRegistry>(
  'PalantirRegistry'
);

export const [getChrome, setChrome] = createGetterSetter<ChromeStart>('Chrome');

export const [getNotifications, setNotifications] = createGetterSetter<NotificationsStart>(
  'Notifications'
);
