/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MAX_OUTPUT_CHAR } from './constants';

export const truncate = (text: string, maxLength: number = MAX_OUTPUT_CHAR) => {
  if (text.length <= maxLength) return text;
  const tailMessage = '\n\nOutput is too long, truncated...';
  return text.slice(0, MAX_OUTPUT_CHAR - tailMessage.length) + tailMessage;
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
