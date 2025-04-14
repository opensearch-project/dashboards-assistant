/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function addTitleTextLayer(json: any) {
  if (!json.title) return json;

  const titleTextLayer = {
    mark: {
      type: 'text',
      align: 'center',
      dy: 40,
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
            fontSize: 50,
            fontWeight: 'bold',
          },
          encoding,
        },
      ],
    };
  }
  layeredSpec.layer.push(titleTextLayer);

  return layeredSpec;
}

export function checkSingleMetric(textContent: String) {
  const metricsMatch = textContent.match(
    /Number of metrics:\s*\[[^\]]*\]\s*<number of metrics\s*\{(\d+)\}>/
  );
  const dimensionsMatch = textContent.match(
    /Number of dimensions:\s*\[[^\]]*\]\s*<number of dimension\s*\{(\d+)\}>/
  );

  const metricsCount = metricsMatch ? parseInt(metricsMatch[1], 10) : 0;
  const dimensionsCount = dimensionsMatch ? parseInt(dimensionsMatch[1], 10) : 0;

  return metricsCount === 1 && dimensionsCount === 0;
}
