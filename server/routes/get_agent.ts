/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchClient } from '../../../../src/core/server';
import { ML_COMMONS_BASE_API } from '../utils/constants';

export const getAgent = async (id: string, client: OpenSearchClient['transport']) => {
  try {
    const path = `${ML_COMMONS_BASE_API}/config/${id}`;
    const response = await client.request({
      method: 'GET',
      path,
    });

    if (!response || !response.body.ml_configuration?.agent_id) {
      throw new Error(`cannot get agent ${id} by calling the api: ${path}`);
    }
    return response.body.ml_configuration.agent_id;
  } catch (error) {
    const errorMessage = JSON.stringify(error.meta?.body) || error;
    throw new Error(`get agent ${id} failed, reason: ${errorMessage}`);
  }
};
