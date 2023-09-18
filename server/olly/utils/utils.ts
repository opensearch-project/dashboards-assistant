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
      return await func(...args);
    } catch (error) {
      return `Error when running tool: ${error}`;
    }
  };
};

export const jsonToCsv = (json: object[]) => {
  if (json.length === 0) return 'row_number\n';
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

export const flatten = (response: AggregationBucket[]) => {
  // Flattens each bucket in the response
  for (const bucket in response) {
    if (response.hasOwnProperty(bucket)) {
      response[bucket] = flattenObject(response[bucket]);
    }
  }
  return response;
};

function flattenObject(object: AggregationBucket, prefix = '') {
  const result: Record<string, string> = {};

  // Recursively flattens object if it's an object or an array
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      const combinedKey = prefix ? `${prefix}.${key}` : key;
      const value = object[key];

      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            const nestedObject = flattenObject(value[i], `${combinedKey}.${i}`);
            Object.assign(result, nestedObject);
          }
        } else {
          const nestedObject = flattenObject(value, combinedKey);
          Object.assign(result, nestedObject);
        }
      } else {
        result[combinedKey] = value.toString();
      }
    }
  }
  return result;
}

export type TraceAnalyticsMode = 'jaeger' | 'data_prepper';
export interface AggregationBucket {
  [key: string]: string | number | AggregationBucket | AggregationBucket[];
}
