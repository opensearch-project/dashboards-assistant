/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable, of } from 'rxjs';
import { debounceTime, switchMap, tap, filter, catchError } from 'rxjs/operators';
import { TEXT2VIZ_API } from '.../../../common/constants/llm';
import { HttpSetup } from '../../../../../src/core/public';
import { DataPublicPluginStart } from '../../../../../src/plugins/data/public';

const DATA_SOURCE_DELIMITER = '::';

export const topN = (ppl: string, n: number) => `${ppl} | head ${n}`;

const getDataSourceAndIndexFromLabel = (label: string) => {
  if (label.includes(DATA_SOURCE_DELIMITER)) {
    return [
      label.slice(0, label.indexOf(DATA_SOURCE_DELIMITER)),
      label.slice(label.indexOf(DATA_SOURCE_DELIMITER) + DATA_SOURCE_DELIMITER.length),
    ] as const;
  }
  return [, label] as const;
};

interface Input {
  prompt: string;
  index: string;
  dataSourceId?: string;
}

export class Text2Vega {
  input$ = new BehaviorSubject<Input>({ prompt: '', index: '' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result$: Observable<Record<string, any> | { error: any }>;
  status$ = new BehaviorSubject<'RUNNING' | 'STOPPED'>('STOPPED');
  http: HttpSetup;
  searchClient: DataPublicPluginStart['search'];

  constructor(http: HttpSetup, searchClient: DataPublicPluginStart['search']) {
    this.http = http;
    this.searchClient = searchClient;
    this.result$ = this.input$
      .pipe(
        filter((v) => v.prompt.length > 0),
        debounceTime(200),
        tap(() => this.status$.next('RUNNING'))
      )
      .pipe(
        switchMap((v) =>
          of(v).pipe(
            // text to ppl
            switchMap(async (value) => {
              const [, indexName] = getDataSourceAndIndexFromLabel(value.index);
              const pplQuestion = value.prompt.split('//')[0];
              const ppl = await this.text2ppl(pplQuestion, indexName, value.dataSourceId);
              return {
                ...value,
                ppl,
              };
            }),
            // query sample data with ppl
            switchMap(async (value) => {
              const ppl = topN(value.ppl, 2);
              const res = await this.searchClient
                .search(
                  { params: { body: { query: ppl } }, dataSourceId: value.dataSourceId },
                  { strategy: 'pplraw' }
                )
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .toPromise<any>();
              return { ...value, sample: res.rawResponse };
            }),
            // call llm to generate vega
            switchMap(async (value) => {
              const result = await this.text2vega({
                input: value.prompt,
                ppl: value.ppl,
                sampleData: JSON.stringify(value.sample.jsonData),
                dataSchema: JSON.stringify(value.sample.schema),
                dataSourceId: value.dataSourceId,
              });
              const [dataSourceName] = getDataSourceAndIndexFromLabel(value.index);
              result.data = {
                url: {
                  '%type%': 'ppl',
                  body: { query: value.ppl },
                  data_source_name: dataSourceName,
                },
              };
              return result;
            }),
            catchError((e) => of({ error: e }))
          )
        )
      )
      .pipe(tap(() => this.status$.next('STOPPED')));
  }

  async text2vega({
    input,
    ppl,
    sampleData,
    dataSchema,
    dataSourceId,
  }: {
    input: string;
    ppl: string;
    sampleData: string;
    dataSchema: string;
    dataSourceId?: string;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const escapeField = (json: any, field: string) => {
      if (json[field]) {
        if (typeof json[field] === 'string') {
          json[field] = json[field].replace(/\./g, '\\.');
        }
        if (typeof json[field] === 'object') {
          Object.keys(json[field]).forEach((p) => {
            escapeField(json[field], p);
          });
        }
      }
    };
    const res = await this.http.post(TEXT2VIZ_API.TEXT2VEGA, {
      body: JSON.stringify({
        input,
        ppl,
        sampleData: JSON.stringify(sampleData),
        dataSchema: JSON.stringify(dataSchema),
      }),
      query: { dataSourceId },
    });

    // need to escape field: geo.city -> field: geo\\.city
    escapeField(res, 'encoding');
    return res;
  }

  async text2ppl(query: string, index: string, dataSourceId?: string) {
    const pplResponse = await this.http.post(TEXT2VIZ_API.TEXT2PPL, {
      body: JSON.stringify({
        question: query,
        index,
      }),
      query: { dataSourceId },
    });
    return pplResponse.ppl;
  }

  invoke(value: Input) {
    this.input$.next(value);
  }

  getStatus$() {
    return this.status$;
  }

  getResult$() {
    return this.result$;
  }
}
