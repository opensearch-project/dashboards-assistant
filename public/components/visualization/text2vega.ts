/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable, of } from 'rxjs';
import { debounceTime, switchMap, tap, filter, catchError } from 'rxjs/operators';
import { TEXT2VIZ_API } from '.../../../common/constants/llm';
import { HttpSetup, SavedObjectsStart } from '../../../../../src/core/public';
import { DataPublicPluginStart } from '../../../../../src/plugins/data/public';
import { DataSourceAttributes } from '../../../../../src/plugins/data_source/common/data_sources';

const topN = (ppl: string, n: number) => `${ppl} | head ${n}`;

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
  savedObjects: SavedObjectsStart;

  constructor(
    http: HttpSetup,
    searchClient: DataPublicPluginStart['search'],
    savedObjects: SavedObjectsStart
  ) {
    this.http = http;
    this.searchClient = searchClient;
    this.savedObjects = savedObjects;
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
              const pplQuestion = value.prompt.split('//')[0];
              const ppl = await this.text2ppl(pplQuestion, value.index, value.dataSourceId);
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
              const dataSource = await this.getDataSourceById(value.dataSourceId);
              const dataSourceName = dataSource?.attributes.title;
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
    const [inputQuestion, inputInstruction = ''] = input.split('//');
    const res = await this.http.post(TEXT2VIZ_API.TEXT2VEGA, {
      body: JSON.stringify({
        input_question: inputQuestion.trim(),
        input_instruction: inputInstruction.trim(),
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

  async getDataSourceById(id?: string) {
    if (!id) {
      return null;
    }

    const res = await this.savedObjects.client.get<DataSourceAttributes>('data-source', id);
    if (res.error) {
      return null;
    }
    return res;
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
