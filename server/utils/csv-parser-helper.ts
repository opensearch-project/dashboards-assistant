/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Readable } from 'stream';
import csvParser from 'csv-parser';

export const getJsonFromString = (
  csvString: string,
  options?: csvParser.Options
): Promise<Array<Record<string, string>> | string[][]> => {
  const results: string[][] | Array<Record<string, string>> = [];
  return new Promise((resolve, reject) => {
    Readable.from(csvString)
      .pipe(csvParser(options))
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};
