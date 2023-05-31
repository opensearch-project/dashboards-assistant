/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiResponse } from '@opensearch-project/opensearch/.';
import {
  IndicesGetMappingResponse,
  SearchResponse,
} from '@opensearch-project/opensearch/api/types';
import _ from 'lodash';

/**
 * @template T = unknown - mapping Context
 * @template U = unknown - search Context
 * @param mappings - mapping from get mappings request
 * @param hits - search response that contains a sample document
 * @returns a string that describes fields, types, and sample values
 */
export const generateFieldContext = <T = unknown, U = unknown>(
  mappings: ApiResponse<IndicesGetMappingResponse, T>,
  hits: ApiResponse<SearchResponse<U>, U>
) => {
  const flattenedFields = flattenMappings(mappings);
  const source = hits.body.hits.hits[0]._source;

  return Object.entries(flattenedFields)
    .map(([field, type]) => {
      return `- ${field}: ${type} (${extractValue(source, field, type)})`;
    })
    .join('\n');
};

const extractValue = (source: unknown | undefined, field: string, type: string) => {
  const value = _.get(source, field);
  if (value === undefined) return null;
  if (['text', 'keyword'].includes(type)) return `"${value}"`;
  return value;
};

/**
 * Flatten mappings response to an object of fields and types.
 *
 * @template T = unknown - Context
 * @param mappings - mapping from get mappings request
 * @returns an object of fields and types
 */
const flattenMappings = <T = unknown>(mappings: ApiResponse<IndicesGetMappingResponse, T>) => {
  const rootProperties = mappings.body[Object.keys(mappings.body)[0]].mappings.properties;

  const parseProperties = (
    properties: typeof rootProperties,
    prefixes: string[] = [],
    fields: Record<string, string> = {}
  ) => {
    for (const key in properties) {
      if (!properties.hasOwnProperty(key)) continue;
      const value = properties[key];
      if (value.properties) {
        parseProperties(value.properties, [...prefixes, key], fields);
      } else {
        fields[[...prefixes, key].join('.')] = value.type!;
      }
    }
    return fields;
  };
  return parseProperties(rootProperties);
};
