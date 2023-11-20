/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DynamicToolInput } from 'langchain/tools';
import { MAX_OUTPUT_CHAR } from './constants';

/**
 * Use to wrap tool funcs to truncate when output is too long and swallow if
 * output is an error.
 *
 * @param func - function for a tool
 * @returns a string even when the function throws error
 */
export const protectCall = (func: DynamicToolInput['func']): DynamicToolInput['func'] => {
  return async (...args) => {
    let response;
    try {
      response = await func(...args);
    } catch (error) {
      response = `Error when running tool: ${error}`;
    }
    return truncate(response);
  };
};

export const truncate = (text: string, maxLength: number = MAX_OUTPUT_CHAR) => {
  if (text.length <= maxLength) return text;
  const tailMessage = '\n\nOutput is too long, truncated... end:\n\n';
  return (
    text.slice(0, MAX_OUTPUT_CHAR - tailMessage.length - 300) +
    tailMessage +
    text.slice(text.length - 300)
  );
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
