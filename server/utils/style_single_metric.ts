/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

interface VegaLiteSpec {
  title?: string;
  mark?: unknown;
  encoding?: unknown;
  layer?: object[];
}

export function addTitleTextLayer(json: VegaLiteSpec) {
  if (!json.title) return json;

  const titleTextLayer = {
    mark: {
      type: 'text',
      align: 'center',
      dy: 50,
      fontSize: 16,
      fontWeight: 'bold',
    },
    encoding: {
      text: {
        value: json.title,
      },
    },
  };

  let layeredSpec = { ...json };
  if (!json.layer) {
    const { mark, encoding, ...rest } = json;
    layeredSpec = {
      ...rest,
      layer: [
        {
          mark: {
            type: 'text',
            fontSize: 80,
            fontWeight: 'bold',
          },
          encoding,
        },
      ],
    };
  }
  layeredSpec.layer?.push(titleTextLayer);

  return layeredSpec;
}

// the sample data format is like : "[{\"flight_count\":2033,\"dayOfWeek\":0}]"
// will check if the string only contains one single key-value pair

export function checkSingleMetric(sampleData: string): boolean {
  const regex = /^"\[\{\\?"[^"]+\\?":[^,}]+\}\]"$/;
  return regex.test(sampleData);
}
