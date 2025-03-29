/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task } from './task';
import { DataPublicPluginStart } from '../../../../../src/plugins/data/public';

interface Input {
  ppl: string;
  dataSourceId: string | undefined;
  timeFiledName?: string;
}

export class PPLAggsAutoSuggestTask extends Task<Input, Input> {
  searchClient: DataPublicPluginStart['search'];
  fieldsRegex = /\s*\|\s*fields\s[^|]*/gim;

  constructor(searchClient: DataPublicPluginStart['search']) {
    super();
    this.searchClient = searchClient;
  }

  async execute<T extends Input>(v: T) {
    let ppl = v.ppl;

    if (ppl) {
      const pplHasAgg = this.pplHasAggregation(ppl);

      if (!pplHasAgg) {
        // NOTE: temporary fix for the OS 2.17 PPL bug which `fields` keyword causes PPL to fail
        ppl = ppl.replace(this.fieldsRegex, '');
      }

      // if no aggregation, will try auto suggest one
      if (!pplHasAgg) {
        if (v.timeFiledName) {
          const dateRangePPL = `${ppl} | stats min(${v.timeFiledName}) as min, max(${v.timeFiledName}) as max`;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let res: any;
          try {
            res = await this.searchClient
              .search(
                { params: { body: { query: dateRangePPL } }, dataSourceId: v.dataSourceId },
                { strategy: 'pplraw' }
              )
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .toPromise<any>();

            if (!res || !res.rawResponse || res.rawResponse.total === 0) {
              ppl = `${ppl} | stats count()`;
            } else {
              // get min and max and calculate proper interval by range
              const min = res.rawResponse.jsonData[0].min;
              const max = res.rawResponse.jsonData[0].max;
              const interval =
                this.searchClient.aggs.calculateAutoTimeExpression({ from: min, to: max }) || '1d';

              ppl = `${ppl} | stats count() by span(${v.timeFiledName}, ${interval})`;
            }
          } catch (e) {
            ppl = `${ppl} | stats count()`;
          }
        } else {
          ppl = `${ppl} | stats count()`;
        }

        // override the original input with suggested ppl
        return { ...v, ppl };
      }
    }
    // directly return original input
    return v;
  }

  private pplHasAggregation(ppl: string) {
    const statsRegex = /\|\s*stats\s+/i;
    return statsRegex.test(ppl);
  }
}
