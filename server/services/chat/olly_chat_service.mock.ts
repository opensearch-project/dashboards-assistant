/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OllyChatService } from './olly_chat_service';

const mockOllyChatService: jest.Mocked<OllyChatService> = {
  requestLLM: jest.fn(),
  abortAgentExecution: jest.fn(),
};

jest.mock('./olly_chat_service', () => {
  return {
    OllyChatService: () => mockOllyChatService,
  };
});

export { mockOllyChatService };
