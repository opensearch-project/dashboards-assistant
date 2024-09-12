/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: true }),
  chat: schema.object({
    enabled: schema.boolean({ defaultValue: false }),
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
});

export type ConfigSchema = TypeOf<typeof configSchema>;
