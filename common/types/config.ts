/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: true }),
  chat: schema.object({
    enabled: schema.boolean({ defaultValue: false }),
    trace: schema.boolean({ defaultValue: true }),
    feedback: schema.boolean({ defaultValue: true }),
    allowRenameConversation: schema.boolean({ defaultValue: true }),
    deleteConversation: schema.boolean({ defaultValue: true }),
    regenerateMessage: schema.boolean({ defaultValue: true }),
    showConversationHistory: schema.boolean({ defaultValue: true }),
  }),
  incontextInsight: schema.object({
    enabled: schema.boolean({ defaultValue: true }),
  }),
  next: schema.object({
    enabled: schema.boolean({ defaultValue: false }),
  }),
  text2viz: schema.object({
    enabled: schema.boolean({ defaultValue: false }),
  }),
  alertInsight: schema.object({
    enabled: schema.boolean({ defaultValue: false }),
  }),
  smartAnomalyDetector: schema.object({
    enabled: schema.boolean({ defaultValue: false }),
  }),
  branding: schema.object({
    label: schema.maybe(schema.string()),
    logo: schema.maybe(
      schema.object({
        gradient: schema.maybe(schema.string()),
        gray: schema.maybe(schema.string()),
        white: schema.maybe(schema.string()),
      })
    ),
  }),
});

export type ConfigSchema = TypeOf<typeof configSchema>;
