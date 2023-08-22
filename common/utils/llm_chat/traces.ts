/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Run } from 'langchain/callbacks';
import { AgentRun } from 'langchain/dist/callbacks/handlers/tracer';
import _ from 'lodash';

export interface LangchainTrace {
  id: Run['id'];
  parentRunId?: Run['parent_run_id'];
  actions?: AgentRun['actions'];
  type: Run['run_type'];
  startTime: Run['start_time'];
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

/**
 * By default, tool traces have name 'DynamicTool'. Replace name for all tool
 * traces with the tool used in parent run actions.
 */
const replaceToolNames = (traces: LangchainTrace[]) => {
  return traces.map((trace) => ({
    ...trace,
    ...(trace.type === 'tool' && {
      name: _.get(
        traces.find((t) => t.id === trace.parentRunId),
        'actions.0.tool',
        trace.name
      ),
    }),
  }));
};

const traverse = (runs: Array<Run | AgentRun>, traces: LangchainTrace[] = []) => {
  traces.push(
    ...runs.map((run) => ({
      id: run.id,
      parentRunId: run.parent_run_id,
      type: run.run_type,
      startTime: run.start_time,
      name: run.name,
      input: getValue(run.inputs, ['input', 'question', 'messages.0.0.kwargs.content']),
      output: run.outputs && getValue(run.outputs, ['output', 'text', 'generations.0.0.text']),
      ...('actions' in run && { actions: run.actions }),
    }))
  );
  runs.forEach((run) => {
    if (run.child_runs) traverse(run.child_runs, traces);
  });
  return traces;
};

export const convertToTraces = (runs: Run[]) => {
  return replaceToolNames(traverse(runs));
};
