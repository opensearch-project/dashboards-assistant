/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from '../../../../src/core/public';
import { AssistantClient } from './assistant_client';

export interface AssistantServiceStart {
  client: AssistantClient;
}

export class AssistantService {
  constructor() {}

  setup() {}

  start(http: HttpSetup): AssistantServiceStart {
    const assistantClient = new AssistantClient(http);
    return {
      client: assistantClient,
    };
  }

  stop() {}
}
