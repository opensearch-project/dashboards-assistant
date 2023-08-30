/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AssistantPlugin } from './plugin';

export { AssistantPlugin as Plugin };

export const plugin = () => new AssistantPlugin();
