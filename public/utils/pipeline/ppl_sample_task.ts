/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task } from './task';
import { DataPublicPluginStart } from '../../../../../src/plugins/data/public';

interface Input {
  ppl: string;
  dataSourceId: string | undefined;
  pplSampleSize?: number;
}

const topN = (ppl: string, n: number = 2) => `${ppl} | head ${n}`;

export class PPLSampleTask extends Task<Input, Input & { sample: string }> {
  searchClient: DataPublicPluginStart['search'];

  constructor(searchClient: DataPublicPluginStart['search']) {
    super();
    this.searchClient = searchClient;
  }

  async execute<T extends Input>(v: T) {
    const ppl = topN(v.ppl, v.pplSampleSize);
    const res = await this.searchClient
      .search(
        { params: { body: { query: ppl } }, dataSourceId: v.dataSourceId },
        { strategy: 'pplraw' }
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .toPromise<any>();
    if (res.rawResponse.total === 0) {
      throw new Error(`There is no result with the generated query: '${v.ppl}'.`);
    }
    return { ...v, sample: res.rawResponse };
  }
}
