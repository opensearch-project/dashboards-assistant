import { ApiResponse } from '@opensearch-project/opensearch/.';
import { IndicesGetMappingResponse } from '@opensearch-project/opensearch/api/types';

/**
 * Wrap string with backticks.
 *
 * @param str - string
 */
export const wrap = (str: string) => '`' + str + '`';

/**
 * Flatten mappings response to an object of fields and types.
 *
 * @template T = unknown - Context
 * @param mappings - mapping from get mappings request
 */
export const flattenMappings = <T = unknown>(
  mappings: ApiResponse<IndicesGetMappingResponse, T>
) => {
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
