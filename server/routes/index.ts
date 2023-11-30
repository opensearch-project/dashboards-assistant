/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoutesOptions } from '../types';
import { IRouter } from '../../../../src/core/server';
import { registerChatRoutes } from './chat_routes';
import { registerFeedbackRoutes } from './feedback_routes';

export function setupRoutes(router: IRouter, routeOptions: RoutesOptions) {
  registerChatRoutes(router, routeOptions);
  registerFeedbackRoutes(router);
}
