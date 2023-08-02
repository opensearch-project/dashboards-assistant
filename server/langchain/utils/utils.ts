/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DynamicToolInput } from 'langchain/tools';

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
