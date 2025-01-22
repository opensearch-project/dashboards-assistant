/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as services from '../../dashboards-assistant/public/services';

interface ChatConfig {
  enabled: boolean;
  trace: boolean;
  feedback: boolean;
  deleteConversation: boolean;
}

interface ConfigSchema {
  enabled: boolean;
  chat: ChatConfig;
  incontextInsight: { enabled: boolean };
  next: { enabled: boolean };
  text2viz: { enabled: boolean };
  alertInsight: { enabled: boolean };
  smartAnomalyDetector: { enabled: boolean };
  branding: {
    label: string | undefined;
    logo: string | undefined;
  };
}
export const getMockConfigSchema = (
  overrides: { chat?: Partial<ChatConfig> } = {}
): ConfigSchema => ({
  enabled: true,
  chat: {
    enabled: true,
    trace: true,
    feedback: true,
    deleteConversation: true,
    ...(overrides.chat || {}),
  },
  incontextInsight: { enabled: true },
  next: { enabled: false },
  text2viz: { enabled: false },
  alertInsight: { enabled: false },
  smartAnomalyDetector: { enabled: false },
  branding: { label: undefined, logo: undefined },
});

export const setupConfigSchemaMock = (overrides: Partial<{ chat: Partial<ChatConfig> }> = {}) => {
  jest.spyOn(services, 'getConfigSchema').mockReturnValue(getMockConfigSchema(overrides));
};
