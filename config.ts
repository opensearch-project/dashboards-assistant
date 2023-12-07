/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: true }),
  chat: schema.object({
    enabled: schema.boolean({ defaultValue: false }),
    rootAgentName: schema.conditional(
      schema.siblingRef('enabled'),
      true,
      schema.string(),
      schema.maybe(schema.string())
    ),
  }),
});

export type ConfigSchema = TypeOf<typeof configSchema>;
