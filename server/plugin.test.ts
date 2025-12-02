/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AssistantPlugin } from './plugin';
import { coreMock } from '../../../src/core/server/mocks';
import { loggerMock } from '../../../src/core/server/logging/logger.mock';
import { of } from 'rxjs';
import { MessageParser } from './types';
import {
  PluginInitializerContext,
  OpenSearchDashboardsRequest,
  IRouter,
  Capabilities,
} from '../../../src/core/server';
import { ENABLE_AI_FEATURES } from './utils/constants';

describe('AssistantPlugin', () => {
  let plugin: AssistantPlugin;
  const mockLogger = loggerMock.create();
  const mockCoreSetup = coreMock.createSetup();
  const mockCoreStart = coreMock.createStart();
  const mockPluginInitializerContext = ({
    logger: {
      get: jest.fn(() => mockLogger),
    },
    config: {
      create: jest.fn(),
    },
  } as unknown) as PluginInitializerContext;

  beforeEach(() => {
    jest.clearAllMocks();

    // @ts-ignore
    mockPluginInitializerContext.config.create.mockReturnValue(
      of({
        text2viz: {
          enabled: true,
        },
        alertInsight: {
          enabled: true,
        },
      })
    );

    mockCoreSetup.getStartServices = jest.fn().mockResolvedValue([mockCoreStart]);

    const mockUiSettingsClient = {
      get: jest.fn().mockResolvedValue(true),
    };
    mockCoreStart.uiSettings.asScopedToClient = jest.fn().mockReturnValue(mockUiSettingsClient);

    const mockSavedObjectsClient = {};
    mockCoreStart.savedObjects.getScopedClient = jest.fn().mockReturnValue(mockSavedObjectsClient);

    plugin = new AssistantPlugin(mockPluginInitializerContext);
  });

  describe('setup', () => {
    it('should register routes and message parsers', async () => {
      const mockRouter = ({
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        handleLegacyErrors: jest.fn((handler) => handler),
        getRoutes: jest.fn().mockReturnValue([]),
      } as unknown) as IRouter;
      mockCoreSetup.http.createRouter.mockReturnValue(mockRouter);

      mockCoreSetup.capabilities.registerProvider = jest.fn();
      mockCoreSetup.capabilities.registerSwitcher = jest.fn();
      mockCoreSetup.savedObjects.registerType = jest.fn();

      mockCoreSetup.dynamicConfigService.getStartService = jest.fn().mockResolvedValue({
        getAsyncLocalStore: jest.fn().mockReturnValue({}),
        getClient: jest.fn().mockReturnValue({
          getConfig: jest.fn().mockResolvedValue({
            enabled: true,
            chat: {
              enabled: true,
            },
          }),
        }),
      });

      const setupResult = await plugin.setup(mockCoreSetup);

      // Verify router was created
      expect(mockCoreSetup.http.createRouter).toHaveBeenCalled();

      // Verify route handler context was registered
      expect(mockCoreSetup.http.registerRouteHandlerContext).toHaveBeenCalledWith(
        'assistant_plugin',
        expect.any(Function)
      );

      // Verify capabilities were registered
      expect(mockCoreSetup.capabilities.registerProvider).toHaveBeenCalled();
      expect(mockCoreSetup.capabilities.registerSwitcher).toHaveBeenCalled();

      // Verify setup result has expected properties
      expect(setupResult).toHaveProperty('assistantService');
      expect(setupResult).toHaveProperty('registerMessageParser');
      expect(setupResult).toHaveProperty('removeMessageParser');
    });

    it('should register and remove message parsers correctly', async () => {
      const mockRouter = ({
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        handleLegacyErrors: jest.fn((handler) => handler),
        getRoutes: jest.fn().mockReturnValue([]),
      } as unknown) as IRouter;
      mockCoreSetup.http.createRouter.mockReturnValue(mockRouter);

      const setupResult = await plugin.setup(mockCoreSetup);

      const testParser: MessageParser = {
        id: 'test-parser',
        parserProvider: jest.fn(),
      };

      setupResult.registerMessageParser(testParser);

      expect(() => {
        setupResult.registerMessageParser(testParser);
      }).toThrow();

      // Remove the parser
      setupResult.removeMessageParser('test-parser');

      // Verify logger was called when removing non-existent parser
      setupResult.removeMessageParser('non-existent-parser');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'There is not a messageParser whose id is non-existent-parser'
      );
    });

    it('should handle errors from dynamic config service', async () => {
      const mockRouter = ({
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        handleLegacyErrors: jest.fn((handler) => handler),
        getRoutes: jest.fn().mockReturnValue([]),
      } as unknown) as IRouter;
      mockCoreSetup.http.createRouter.mockReturnValue(mockRouter);

      mockCoreSetup.dynamicConfigService.getStartService = jest.fn().mockResolvedValue({
        getAsyncLocalStore: jest.fn().mockReturnValue({}),
        getClient: jest.fn().mockReturnValue({
          getConfig: jest.fn().mockRejectedValue(new Error('Config error')),
        }),
      });

      await plugin.setup(mockCoreSetup);

      // Verify capabilities switcher was registered
      expect(mockCoreSetup.capabilities.registerSwitcher).toHaveBeenCalledTimes(1);

      // Execute the registered switcher function with mock request
      const switcherFn = mockCoreSetup.capabilities.registerSwitcher.mock.calls[0][0];
      const mockRequest = {} as OpenSearchDashboardsRequest;
      const mockCapabilities = {} as Capabilities;
      const result = await switcherFn(mockRequest, mockCapabilities);

      // Verify error was logged and empty object returned
      expect(mockLogger.error).toHaveBeenCalled();
      expect(result).toEqual({});
    });

    it('should return correct capabilities based on settings', async () => {
      // Mock router
      const mockRouter = ({
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        handleLegacyErrors: jest.fn((handler) => handler),
        getRoutes: jest.fn().mockReturnValue([]),
      } as unknown) as IRouter;
      mockCoreSetup.http.createRouter.mockReturnValue(mockRouter);

      mockCoreSetup.dynamicConfigService.getStartService = jest.fn().mockResolvedValue({
        getAsyncLocalStore: jest.fn().mockReturnValue({}),
        getClient: jest.fn().mockReturnValue({
          getConfig: jest.fn().mockResolvedValue({
            enabled: true,
            chat: {
              enabled: true,
            },
          }),
        }),
      });

      // Mock UI settings client to return true for ENABLE_AI_FEATURES
      const mockUiSettingsClient = {
        get: jest.fn().mockImplementation((key) => {
          if (key === ENABLE_AI_FEATURES) return Promise.resolve(true);
          return Promise.resolve(undefined);
        }),
      };
      mockCoreStart.uiSettings.asScopedToClient = jest.fn().mockReturnValue(mockUiSettingsClient);

      // Execute setup
      await plugin.setup(mockCoreSetup);

      // Execute the registered switcher function
      const switcherFn = mockCoreSetup.capabilities.registerSwitcher.mock.calls[0][0];
      const mockRequest = {} as OpenSearchDashboardsRequest;
      const mockCapabilities = {} as Capabilities;
      const result = await switcherFn(mockRequest, mockCapabilities);

      // Verify correct capabilities are returned
      expect(result).toEqual({
        assistant: {
          enabled: true,
          chatEnabled: true,
        },
      });
    });

    it('should handle uiSettingsClient.get error and return false', async () => {
      // Mock router
      const mockRouter = ({
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        handleLegacyErrors: jest.fn((handler) => handler),
        getRoutes: jest.fn().mockReturnValue([]),
      } as unknown) as IRouter;
      mockCoreSetup.http.createRouter.mockReturnValue(mockRouter);

      mockCoreSetup.dynamicConfigService.getStartService = jest.fn().mockResolvedValue({
        getAsyncLocalStore: jest.fn().mockReturnValue({}),
        getClient: jest.fn().mockReturnValue({
          getConfig: jest.fn().mockResolvedValue({
            enabled: true,
            chat: {
              enabled: true,
            },
          }),
        }),
      });

      // Mock UI settings client to throw error for ENABLE_AI_FEATURES
      const mockUiSettingsClient = {
        get: jest.fn().mockRejectedValue(new Error('Settings error')),
      };
      mockCoreStart.uiSettings.asScopedToClient = jest.fn().mockReturnValue(mockUiSettingsClient);

      // Execute setup
      await plugin.setup(mockCoreSetup);

      // Execute the registered switcher function
      const switcherFn = mockCoreSetup.capabilities.registerSwitcher.mock.calls[0][0];
      const mockRequest = {} as OpenSearchDashboardsRequest;
      const mockCapabilities = {} as Capabilities;
      const result = await switcherFn(mockRequest, mockCapabilities);

      // Verify that when uiSettingsClient.get throws, it catches and uses false
      expect(result).toEqual({
        assistant: {
          enabled: false, // dynamicConfig.enabled (true) && isAssistantEnabledBySetting (false)
          chatEnabled: false, // dynamicConfig.chat.enabled (true) && isAssistantEnabledBySetting (false)
        },
      });
    });
  });

  describe('start and stop', () => {
    it('should call assistantService start and stop methods', async () => {
      const mockRouter = ({
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        handleLegacyErrors: jest.fn((handler) => handler),
        getRoutes: jest.fn().mockReturnValue([]),
      } as unknown) as IRouter;
      mockCoreSetup.http.createRouter.mockReturnValue(mockRouter);

      const assistantServiceStartSpy = jest.spyOn(plugin['assistantService'], 'start');
      const assistantServiceStopSpy = jest.spyOn(plugin['assistantService'], 'stop');

      await plugin.setup(mockCoreSetup);
      plugin.start(mockCoreStart);
      plugin.stop();

      // Verify assistantService methods were called
      expect(assistantServiceStartSpy).toHaveBeenCalledTimes(1);
      expect(assistantServiceStopSpy).toHaveBeenCalledTimes(1);
    });
  });
});
