/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AGENT_API } from '../../../common/constants/llm';
import { HttpSetup } from '../../../../../src/core/public';
export async function checkAgentsExist(
  http: HttpSetup,
  agentConfigName: string | string[],
  dataSourceId?: string
) {
  const response = await http.get(AGENT_API.CONFIG_EXISTS, {
    query: { agentConfigName, dataSourceId },
  });
  return response;
}
