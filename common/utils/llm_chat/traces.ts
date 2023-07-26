/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Run } from 'langchain/callbacks';
import _ from 'lodash';

export interface LangchainTrace {
  id: string;
  type: Run['run_type'];
  startTime: number;
  name: string;
  input: string;
  output?: string;
}

const getValue = (obj: Record<string, string>, possibleKeys: string[]) => {
  for (const key of possibleKeys) {
    const value = _.get(obj, key);
    if (value) return value;
  }
  return '';
};

const parseRuns = (traces: LangchainTrace[], runs: Run[]) => {
  traces.push(
    ...runs.map((run) => ({
      id: run.id,
      type: run.run_type,
      startTime: run.start_time,
      name: run.name,
      input: getValue(run.inputs, ['input', 'question', 'messages.0.0.data.content']),
      output: run.outputs && getValue(run.outputs, ['output', 'text', 'generations.0.0.text']),
    }))
  );
  runs.forEach((run) => {
    if (run.child_runs) parseRuns(traces, run.child_runs);
  });
};

export const convertToTraces = (runs: Run[]) => {
  const traces: LangchainTrace[] = [];
  parseRuns(traces, runs);
  return traces;
};
