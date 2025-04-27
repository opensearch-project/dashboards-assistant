/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getChatbotOpenStatus,
  setChatbotOpenStatus,
  setChatbotSidecarConfig,
  getChatbotState,
  setChatbotState,
  ChatbotState,
} from './persisted_chatbot_state';
import { getLocalStorage } from '../services';
import { SIDECAR_DOCKED_MODE } from '../../../../src/core/public';

// Mock the services module
jest.mock('../services', () => ({
  getLocalStorage: jest.fn(),
}));

describe('Persisted chatbot state utils', () => {
  let mockLocalStorage: {
    get: jest.Mock;
    set: jest.Mock;
  };

  beforeEach(() => {
    // Set up mock local storage
    mockLocalStorage = {
      get: jest.fn(),
      set: jest.fn(),
    };
    (getLocalStorage as jest.Mock).mockReturnValue(mockLocalStorage);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getChatbotState', () => {
    it('should retrieve chatbot state from local storage', () => {
      const mockState: ChatbotState = { isOpen: true };
      mockLocalStorage.get.mockReturnValue(mockState);

      const result = getChatbotState();

      expect(mockLocalStorage.get).toHaveBeenCalledWith('chatbotState');
      expect(result).toEqual(mockState);
    });

    it('should return null if no state is stored', () => {
      mockLocalStorage.get.mockReturnValue(null);

      const result = getChatbotState();

      expect(mockLocalStorage.get).toHaveBeenCalledWith('chatbotState');
      expect(result).toBeNull();
    });
  });

  describe('setChatbotState', () => {
    it('should set chatbot state in local storage', () => {
      const mockState: ChatbotState = { isOpen: true };

      setChatbotState(mockState);

      expect(mockLocalStorage.set).toHaveBeenCalledWith('chatbotState', mockState);
    });
  });

  describe('getChatbotOpenStatus', () => {
    it('should return true when chatbot is open', () => {
      mockLocalStorage.get.mockReturnValue({ isOpen: true });

      const result = getChatbotOpenStatus();

      expect(result).toBe(true);
    });

    it('should return false when chatbot is closed', () => {
      mockLocalStorage.get.mockReturnValue({ isOpen: false });

      const result = getChatbotOpenStatus();

      expect(result).toBe(false);
    });

    it('should return false when chatbot state is not set', () => {
      mockLocalStorage.get.mockReturnValue(null);

      const result = getChatbotOpenStatus();

      expect(result).toBe(false);
    });

    it('should return false when isOpen property is not set', () => {
      mockLocalStorage.get.mockReturnValue({ sidecarConfig: {} });

      const result = getChatbotOpenStatus();

      expect(result).toBe(false);
    });
  });

  describe('setChatbotOpenStatus', () => {
    it('should update isOpen status while preserving existing state', () => {
      const existingState = {
        isOpen: false,
        sidecarConfig: {
          dockedMode: SIDECAR_DOCKED_MODE.LEFT,
          paddingSize: 10,
        },
      };
      mockLocalStorage.get.mockReturnValue(existingState);

      setChatbotOpenStatus(true);

      expect(mockLocalStorage.set).toHaveBeenCalledWith('chatbotState', {
        ...existingState,
        isOpen: true,
      });
    });

    it('should create new state with isOpen when no state exists', () => {
      mockLocalStorage.get.mockReturnValue(null);

      setChatbotOpenStatus(true);

      expect(mockLocalStorage.set).toHaveBeenCalledWith('chatbotState', { isOpen: true });
    });
  });

  describe('setChatbotSidecarConfig', () => {
    it('should update sidecarConfig while preserving existing state', () => {
      const existingState = {
        isOpen: true,
        sidecarConfig: {
          dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
          paddingSize: 10,
        },
      };
      mockLocalStorage.get.mockReturnValue(existingState);

      const newConfig = {
        isHidden: false,
        dockedMode: SIDECAR_DOCKED_MODE.LEFT,
        paddingSize: 20,
      };
      setChatbotSidecarConfig(newConfig);

      expect(mockLocalStorage.set).toHaveBeenCalledWith('chatbotState', {
        ...existingState,
        sidecarConfig: {
          dockedMode: SIDECAR_DOCKED_MODE.LEFT,
          paddingSize: 20,
        },
      });
    });

    it('should create new state with sidecarConfig when no state exists', () => {
      mockLocalStorage.get.mockReturnValue(null);

      const newConfig = {
        isHidden: false,
        dockedMode: SIDECAR_DOCKED_MODE.LEFT,
        paddingSize: 20,
      };
      setChatbotSidecarConfig(newConfig);

      expect(mockLocalStorage.set).toHaveBeenCalledWith('chatbotState', {
        sidecarConfig: {
          dockedMode: SIDECAR_DOCKED_MODE.LEFT,
          paddingSize: 20,
        },
      });
    });

    it('should correctly omit isHidden property from the config', () => {
      mockLocalStorage.get.mockReturnValue({});

      const newConfig = {
        isHidden: true,
        dockedMode: SIDECAR_DOCKED_MODE.LEFT,
        paddingSize: 20,
      };
      setChatbotSidecarConfig(newConfig);

      expect(mockLocalStorage.set).toHaveBeenCalledWith('chatbotState', {
        sidecarConfig: {
          dockedMode: SIDECAR_DOCKED_MODE.LEFT,
          paddingSize: 20,
        },
      });

      // Verify isHidden was removed
      const calledArg = mockLocalStorage.set.mock.calls[0][1];
      expect(calledArg.sidecarConfig.isHidden).toBeUndefined();
    });
  });
});
