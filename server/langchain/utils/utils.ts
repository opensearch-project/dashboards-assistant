/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'fs';
import { DynamicToolInput } from 'langchain/tools';

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
