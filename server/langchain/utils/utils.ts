/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'fs';
import { ChainRun, LLMRun, ToolRun } from 'langchain/dist/callbacks/handlers/tracer_langchain_v1';
import { DynamicToolInput } from 'langchain/tools';
import { OpenSearchClient } from '../../../../../src/core/server';
import { SearchRequest } from '../../../../../src/plugins/data/common';
import { LLM_INDEX } from '../../../common/constants/llm';

/**
 * @param status - json object that needs to be logged
 * @param name - name of the log
 */
export const logToFile = async (status: object, name: string) => {
  await fs.mkdir(`${__dirname}/../../../.logs`, { recursive: true });
  fs.appendFile(
    `${__dirname}/../../../.logs/${name}.log`,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      ...status,
    }) + '\n'
  );
};

/**
 * @param func - function for a tool
 * @returns a string even when the function throws error
 */
export const swallowErrors = (func: DynamicToolInput['func']): DynamicToolInput['func'] => {
  return async (...args) => {
    try {
      return func(...args);
    } catch (error) {
      return `Error when running tool: ${error}`;
    }
  };
};

export const jsonToCsv = (json: object[]) => {
  const rows = [];

  // Add header row with keys as column names
  const header = Object.keys(json[0]);
  rows.push(['row_number', ...header]);

  // Add data rows
  json.forEach((obj, index) => {
    const values = Object.values(obj);
    const row = [index + 1, ...values];
    rows.push(row);
  });

  // Convert rows to CSV string
  const csv = rows.map((row) => row.join(',')).join('\n');

  return csv;
};

export const fetchLangchainTraces = (client: OpenSearchClient, sessionId: string) => {
  const query: SearchRequest['body'] = {
    query: {
      term: {
        session_id: sessionId,
      },
    },
    sort: [
      {
        start_time: {
          order: 'asc',
        },
      },
    ],
  };
  return client.search<ToolRun | ChainRun | LLMRun>({
    index: LLM_INDEX.TRACES,
    body: query,
    size: 10,
  });
};
