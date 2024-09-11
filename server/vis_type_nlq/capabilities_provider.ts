/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VIS_NLQ_SAVED_OBJECT } from '../../common/constants/vis_type_nlq';

export const capabilitiesProvider = () => ({
  [VIS_NLQ_SAVED_OBJECT]: {
    show: true,
  },
});
