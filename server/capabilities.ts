/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CapabilitiesSwitcher } from '../../../src/core/server';

export const capabilitiesProvider = () => ({
  observability: {
    show: true,
  },
  assistant: {
    enabled: true,
  },
});

// Users can customize the logic of flipping assistant feature UI capabilities here
export const capabilitiesSwitcher: CapabilitiesSwitcher = (request, capabilities) => {
  return {
    assistant: {
      enabled: true,
    },
  };
};
