/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task } from './task';
import { HttpSetup, SavedObjectsStart } from '../../../../../src/core/public';
import { TEXT2VIZ_API } from '../../../common/constants/llm';
import { DataSourceAttributes } from '../../../../../src/plugins/data_source/common/data_sources';

interface Input {
  inputQuestion: string;
  inputInstruction: string;
  ppl: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sample: any;
  dataSourceId: string | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Text2VegaTask extends Task<Input, Input & { vega: any }> {
  http: HttpSetup;
  savedObjects: SavedObjectsStart;

  constructor(http: HttpSetup, savedObjects: SavedObjectsStart) {
    super();
    this.http = http;
    this.savedObjects = savedObjects;
  }

  async execute<T extends Input>(v: T) {
    const result = await this.text2vega({
      inputQuestion: v.inputQuestion,
      inputInstruction: v.inputInstruction,
      ppl: v.ppl,
      sampleData: JSON.stringify(v.sample.jsonData),
      dataSchema: JSON.stringify(v.sample.schema),
      dataSourceId: v.dataSourceId,
    });
    const dataSource = await this.getDataSourceById(v.dataSourceId);
    const dataSourceName = dataSource?.attributes.title;
    result.data = {
      url: {
        '%type%': 'ppl',
        body: { query: v.ppl },
        data_source_name: dataSourceName,
      },
    };
    return { ...v, vega: result };
  }

  async text2vega({
    inputQuestion,
    inputInstruction = '',
    ppl,
    sampleData,
    dataSchema,
    dataSourceId,
  }: {
    inputQuestion: string;
    inputInstruction?: string;
    ppl: string;
    sampleData: string;
    dataSchema: string;
    dataSourceId?: string;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const escapeField = (json: any, field: string) => {
      if (json[field]) {
        // Only escape field which name is 'field'
        if (typeof json[field] === 'string' && field === 'field') {
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
    escapeField(res, 'layer');
    return res;
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
}
