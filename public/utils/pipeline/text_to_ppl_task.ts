/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from '../../../../../src/core/public';
import { Task } from './task';
import { TEXT2VIZ_API } from '../../../common/constants/llm';

export const processInputQuestion = (inputQuestion: string) => {
  const httpErrorInstructionAppendRegExp = new RegExp(`(?:${['error', 'fail'].join('|')})`, 'i');
  if (httpErrorInstructionAppendRegExp.test(inputQuestion)) {
    return `${inputQuestion}. If you're dealing logs with http response code, then error usually refers to http response code like 4xx, 5xx`;
  }
  return inputQuestion;
};

interface Input {
  inputQuestion: string;
  index: string;
  dataSourceId?: string;
  timeFiledName?: string;
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
      ppl = await this.text2ppl(processInputQuestion(v.inputQuestion), v.index, v.dataSourceId);
    } catch (e) {
      throw new Error(
        `Error while generating PPL query with input: ${v.inputQuestion}. Please try rephrasing your question.`
      );
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
