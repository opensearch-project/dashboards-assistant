/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PublicContract } from '@osd/utility-types';
import { AgentFrameworkStorageService } from './agent_framework_storage_service';

const mockAgentFrameworkStorageService: jest.Mocked<PublicContract<
  AgentFrameworkStorageService
>> = {
  getSession: jest.fn(),
  getSessions: jest.fn(),
  saveMessages: jest.fn(),
  deleteSession: jest.fn(),
  updateSession: jest.fn(),
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
