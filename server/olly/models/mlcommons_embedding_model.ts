/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiResponse } from '@opensearch-project/opensearch/lib/Transport';
import { Embeddings, EmbeddingsParams } from 'langchain/embeddings/base';
import { OpenSearchClient } from '../../../../../src/core/server';
import {
  ASSISTANT_CONFIG_DOCUMENT,
  ASSISTANT_CONFIG_INDEX,
  ML_COMMONS_BASE_API,
} from './constants';

interface MLCommonsEmbeddingsResponse {
  inference_results: Array<{
    output: Array<{
      name: string;
      data_type: string;
      shape: number[];
      data: number[];
    }>;
  }>;
}

export class MLCommonsEmbeddingsModel extends Embeddings {
  constructor(private opensearchClient: OpenSearchClient, params: EmbeddingsParams = {}) {
    super(params);
  }

  async getModelID() {
    const getResponse = await this.opensearchClient.get<AssistantConfigDoc>({
      id: ASSISTANT_CONFIG_DOCUMENT,
      index: ASSISTANT_CONFIG_INDEX,
    });
    if (!getResponse.body._source) throw new Error('Assistant config source not found.');
    return getResponse.body._source.embeddings_model_id;
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    const mlCommonsModelId = await this.getModelID();
    // reference: https://github.com/opensearch-project/opensearch-py-ml/blob/7b0066afa69294aa3d9c1a18976dad80ee74c037/opensearch_py_ml/ml_commons/ml_commons_client.py#L487
    const mlCommonsResponse = (await this.opensearchClient.transport.request({
      method: 'POST',
      path: `${ML_COMMONS_BASE_API}/_predict/text_embedding/${mlCommonsModelId}`,
      body: {
        text_docs: documents,
        target_response: ['sentence_embedding'],
      },
    })) as ApiResponse<MLCommonsEmbeddingsResponse, unknown>;
    return mlCommonsResponse.body.inference_results.map((inference) => inference.output[0].data);
  }

  async embedQuery(document: string): Promise<number[]> {
    return (await this.embedDocuments([document]))[0];
  }
}
