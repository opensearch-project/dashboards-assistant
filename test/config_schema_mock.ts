/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfigSchema } from 'common/types/config';
import * as services from '../public/services';
interface ChatConfig {
  enabled: boolean;
  trace: boolean;
  feedback: boolean;
  allowRenameConversation: boolean;
  deleteConversation: boolean;
}

export const getMockConfigSchema = (
  overrides: { chat?: Partial<ChatConfig> } = {}
): ConfigSchema => ({
  enabled: true,
  chat: {
    enabled: true,
    trace: true,
    feedback: true,
    allowRenameConversation: true,
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
