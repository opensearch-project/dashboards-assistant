/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchClient } from '../../../../src/core/server';
import { ML_COMMONS_BASE_API } from '../utils/constants';

/**
 *
 */
export const getAgentIdByConfigName = async (
  configName: string,
  client: OpenSearchClient['transport']
): Promise<string> => {
  try {
    const path = `${ML_COMMONS_BASE_API}/config/${configName}`;
    const response = await client.request({
      method: 'GET',
      path,
    });

    if (
      !response ||
      !(response.body.ml_configuration?.agent_id || response.body.configuration?.agent_id)
    ) {
      throw new Error(`cannot get agent ${configName} by calling the api: ${path}`);
    }
    return response.body.ml_configuration?.agent_id || response.body.configuration.agent_id;
  } catch (error) {
    const errorMessage = JSON.stringify(error.meta?.body) || error;
    throw new Error(`get agent ${configName} failed, reason: ${errorMessage}`);
  }
};

export const searchAgent = async (
  { name }: { name: string },
  client: OpenSearchClient['transport']
) => {
  try {
    const requestParams = {
      query: {
        term: {
          'name.keyword': name,
        },
      },
      _source: ['_id'],
      sort: {
        created_time: 'desc',
      },
      size: 1,
    };

    const response = await client.request({
      method: 'GET',
      path: `${ML_COMMONS_BASE_API}/agents/_search`,
      body: requestParams,
    });

    if (!response || response.body.hits.total.value === 0) {
      return undefined;
    }
    return response.body.hits.hits[0]._id;
  } catch (error) {
    const errorMessage = JSON.stringify(error.meta?.body) || error;
    throw new Error(`search ${name} agent failed, reason: ` + errorMessage);
  }
};
