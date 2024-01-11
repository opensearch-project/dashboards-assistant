/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PublicContract } from '@osd/utility-types';
import { AgentFrameworkStorageService } from './agent_framework_storage_service';

const mockAgentFrameworkStorageService: jest.Mocked<PublicContract<
  AgentFrameworkStorageService
>> = {
  getConversation: jest.fn(),
  getConversations: jest.fn(),
  saveMessages: jest.fn(),
  deleteConversation: jest.fn(),
  updateConversation: jest.fn(),
  getTraces: jest.fn(),
  updateInteraction: jest.fn(),
  getInteraction: jest.fn(),
  getMessagesFromInteractions: jest.fn(),
};

jest.mock('./agent_framework_storage_service', () => {
  return {
    AgentFrameworkStorageService: () => mockAgentFrameworkStorageService,
  };
});

const resetMocks = () => {
  Object.values(mockAgentFrameworkStorageService).forEach((item) => item.mockReset());
};

export { mockAgentFrameworkStorageService, resetMocks };
