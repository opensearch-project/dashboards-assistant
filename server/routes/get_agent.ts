/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchClient } from '../../../../src/core/server';
import { ML_COMMONS_BASE_API } from '../utils/constants';
import { AgentNotFoundError } from './errors';

export const getAgentIdByConfigName = async (
  configName: string,
  client: OpenSearchClient['transport']
): Promise<string> => {
  const path = `${ML_COMMONS_BASE_API}/config/${configName}`;
  const response = await client.request({
    method: 'GET',
    path,
  });

  if (
    !response ||
    !(response.body.ml_configuration?.agent_id || response.body.configuration?.agent_id)
  ) {
    throw new AgentNotFoundError(
      `cannot get agent by config name ${configName} by calling the api: ${path}`
    );
  }
  return response.body.ml_configuration?.agent_id || response.body.configuration.agent_id;
};

export const searchAgent = async (
  { name }: { name: string },
  client: OpenSearchClient['transport']
) => {
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

  const path = `${ML_COMMONS_BASE_API}/agents/_search`;
  const response = await client.request({
    method: 'GET',
    path,
    body: requestParams,
  });

  if (!response || response.body.hits.total.value === 0) {
    throw new AgentNotFoundError(`cannot find agent by name ${name} by calling the api: ${path}`);
  }
  return response.body.hits.hits[0]._id as string;
};
