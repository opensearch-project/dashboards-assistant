/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfigSchema } from 'common/types/config';
import * as services from '../public/services';

export const getMockConfigSchema = (
  overrides: { chat?: Partial<ConfigSchema['chat']> } = {}
): ConfigSchema => ({
  enabled: true,
  chat: {
    enabled: true,
    trace: true,
    feedback: true,
    allowRenameConversation: true,
    deleteConversation: true,
    regenerateMessage: true,
    showConversationHistory: true,
    ...(overrides.chat || {}),
  },
  incontextInsight: { enabled: true },
  next: { enabled: false },
  text2viz: { enabled: false },
  alertInsight: { enabled: false },
  smartAnomalyDetector: { enabled: false },
  branding: { label: undefined, logo: undefined },
});

export const setupConfigSchemaMock = (
  overrides: Partial<{ chat: Partial<ConfigSchema['chat']> }> = {}
) => {
  jest.spyOn(services, 'getConfigSchema').mockReturnValue(getMockConfigSchema(overrides));
  console.log('Mocked getConfigSchema:', services.getConfigSchema());
};
