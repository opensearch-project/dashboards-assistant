/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseLanguageModel } from 'langchain/base_language';
import { requestTimesFiltersChain } from '../../../../../server/langchain/chains/filter_generator';

import { SearchRequest } from '../../../../../../../src/plugins/data/common';

export async function addFilters(
  bodyQuery: SearchRequest['body'],
  userQuery: string,
  model: BaseLanguageModel
) {
  const time = await requestTimesFiltersChain(model, userQuery);
  const timeFilter = {
    range: {
      startTime: {
        gte: time?.start_time,
        lte: time?.end_time,
      },
    },
  };
  const must = bodyQuery?.query?.bool?.must;
  if (Array.isArray(must)) must.push(timeFilter);
}
