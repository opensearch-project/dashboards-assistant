/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from '../../../../../src/core/public';
import { Task } from './task';
import { TEXT2VIZ_API } from '../../../common/constants/llm';

interface Input {
  inputQuestion: string;
  index: string;
  dataSourceId?: string;
}

export class Text2PPLTask extends Task<Input, Input & { ppl: string }> {
  http: HttpSetup;

  constructor(http: HttpSetup) {
    super();
    this.http = http;
  }

  async execute<T extends Input>(v: T) {
    let ppl = '';
    try {
      ppl = await this.text2ppl(v.inputQuestion, v.index, v.dataSourceId);
    } catch (e) {
      throw new Error(
        `Error while generating PPL query with input: ${v.inputQuestion}. Please try rephrasing your question.`
      );
    }

    if (ppl) {
      const statsRegex = /\|\s*stats\s+/i;
      const hasStats = statsRegex.test(ppl);
      if (!hasStats) {
        throw new Error(
          `The generated PPL query doesn't seem to contain an aggregation. Ensure your question contains an aggregation (e.g., average, sum, or count) to create a meaningful visualization. Generated PPL: ${ppl}`
        );
      }
    }

    return { ...v, ppl };
  }

  async text2ppl(query: string, index: string, dataSourceId?: string) {
    const res = await this.http.post(TEXT2VIZ_API.TEXT2PPL, {
      body: JSON.stringify({
        question: query,
        index,
      }),
      query: { dataSourceId },
    });
    return res.ppl;
  }
}
