/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable, of } from 'rxjs';
import { debounceTime, switchMap, tap, filter, catchError } from 'rxjs/operators';
import { TEXT2VIZ_API } from '.../../../common/constants/llm';
import { HttpSetup } from '../../../../../src/core/public';

const topN = (ppl: string, n: number) => `${ppl} | head ${n}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createPrompt = (input: string, ppl: string, sample: any) => {
  return `
You're an expert at creating vega-lite visualization. No matter what the user asks, you should reply with a valid vega-lite specification in json.
Your task is to generate Vega-Lite specification in json based on the given sample data, the schema of the data, the PPL query to get the data and the user's input.

Besides, here are some requirements:
1. Do not contain the key called 'data' in vega-lite specification.
2. If mark.type = point and shape.field is a field of the data, the definition of the shape should be inside the root "encoding" object, NOT in the "mark" object, for example, {"encoding": {"shape": {"field": "field_name"}}}
3. Please also generate title and description

The sample data in json format:
${JSON.stringify(sample.jsonData, null, 4)}

This is the schema of the data:
${JSON.stringify(sample.schema, null, 4)}

The user used this PPL query to get the data: ${ppl}

The user's input is: ${input}

Now please reply a valid vega-lite specification in json based on above instructions.
`;
};

export class Text2Vega {
  input$ = new BehaviorSubject({ prompt: '', index: '' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result$: Observable<Record<string, any> | { error: any }>;
  status$ = new BehaviorSubject<'RUNNING' | 'STOPPED'>('STOPPED');
  http: HttpSetup;

  constructor(http: HttpSetup) {
    this.http = http;
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
              const ppl = await this.text2ppl(pplQuestion, value.index);
              return {
                ...value,
                ppl,
              };
            }),
            // query sample data with ppl
            switchMap(async (value) => {
              const ppl = topN(value.ppl, 2);
              const sample = await this.http.post('/api/ppl/search', {
                body: JSON.stringify({ query: ppl, format: 'jdbc' }),
              });
              return { ...value, sample };
            }),
            // call llm to generate vega
            switchMap(async (value) => {
              const prompt = createPrompt(value.prompt, value.ppl, value.sample);
              const result = await this.text2vega(prompt);
              result.data = {
                url: {
                  '%type%': 'ppl',
                  query: value.ppl,
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

  async text2vega(query: string) {
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
      body: JSON.stringify({ query }),
    });
    let result = res.body.inference_results[0].output[0].dataAsMap;
    // sometimes llm returns {response: <schema>} instead of <schema>
    if (result.response) {
      result = JSON.parse(result.response);
    }

    // Sometimes the response contains width and height which is not needed, here delete the these fields
    delete result.width;
    delete result.height;

    // need to escape field: geo.city -> field: geo\\.city
    escapeField(result, 'encoding');
    return result;
  }

  async text2ppl(query: string, index: string) {
    const pplResponse = await this.http.post(TEXT2VIZ_API.TEXT2PPL, {
      body: JSON.stringify({
        question: query,
        index,
      }),
    });
    const result = JSON.parse(pplResponse.body.inference_results[0].output[0].result);
    return result.ppl;
  }

  invoke(value: { prompt: string; index: string }) {
    this.input$.next(value);
  }

  getStatus$() {
    return this.status$;
  }

  getResult$() {
    return this.result$;
  }
}
