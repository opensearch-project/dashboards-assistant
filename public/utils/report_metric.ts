/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { v4 as uuidv4 } from 'uuid';
import { UsageCollectionSetup } from '../../../../src/plugins/usage_collection/public';

export const reportMetric = (
  usageCollection?: UsageCollectionSetup,
  metricAppName: string = 'app',
  metric: string = 'click'
) => {
  if (usageCollection) {
    usageCollection.reportUiStats(
      metricAppName,
      usageCollection.METRIC_TYPE.CLICK,
      metric + '-' + uuidv4()
    );
  }
};
