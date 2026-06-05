/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from '../../../../../src/core/public';
import { Task } from './task';
import { TEXT2VIZ_API } from '../../../common/constants/llm';

interface Input {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sample: any;
  dataSourceId?: string;
}

export class DataInsightsTask extends Task<Input, Input & { dataInsights: string }> {
  http: HttpSetup;

  constructor(http: HttpSetup) {
    super();
    this.http = http;
  }

  async execute<T extends Input>(v: T) {
    const dataInsights: string = await this.getDataInsights(v.sample, v.dataSourceId);
    return { ...v, dataInsights };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getDataInsights(sample: any, dataSourceId?: string) {
    const res = await this.http.post(TEXT2VIZ_API.DATA_INSIGHTS, {
      body: JSON.stringify({
        sampleData: `'${JSON.stringify(sample.jsonData, undefined, 2)}'`,
        dataSchema: `'${JSON.stringify(sample.schema, undefined, 2)}'`,
      }),
      query: { dataSourceId },
    });
    return res;
  }
}
