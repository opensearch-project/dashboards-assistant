/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  // TODO: add here to prevent this plugin from being loaded
  // enabled: schema.boolean({ defaultValue: true }),
  chat: schema.object({
    enabled: schema.boolean({ defaultValue: false }),
  }),
  incontextInsight: schema.object({
    enabled: schema.boolean({ defaultValue: true }),
  }),
});

export type ConfigSchema = TypeOf<typeof configSchema>;
