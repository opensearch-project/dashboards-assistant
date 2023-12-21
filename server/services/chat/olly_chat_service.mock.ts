/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PublicContract } from '@osd/utility-types';
import { OllyChatService } from './olly_chat_service';

const mockOllyChatService: jest.Mocked<PublicContract<OllyChatService>> = {
  requestLLM: jest.fn(),
  regenerate: jest.fn(),
  abortAgentExecution: jest.fn(),
};

jest.mock('./olly_chat_service', () => {
  return {
    OllyChatService: () => mockOllyChatService,
  };
});

export { mockOllyChatService };
