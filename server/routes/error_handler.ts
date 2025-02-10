/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Logger, OpenSearchDashboardsResponseFactory } from '../../../../src/core/server';
import { AgentNotFoundError } from './errors';
import { DataSourceNotFoundError } from '../utils/get_opensearch_client_transport';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleError = (e: any, res: OpenSearchDashboardsResponseFactory, logger: Logger) => {
  logger.error('Error occurred', e);
  // Handle specific type of Errors
  if (e instanceof AgentNotFoundError) {
    return res.notFound({ body: 'Agent not found' });
  }

  // Handle specific type of Errors
  if (e instanceof AgentNotFoundError) {
    return res.notFound({ body: 'Agent not found' });
  }

  if (e instanceof DataSourceNotFoundError) {
    const msg = i18n.translate('assistant.server.error.workspaceDataSourceNotFound', {
      defaultMessage: 'Workspace/data source is invalid or not found.',
    });
    return res.notFound({ body: msg });
  }

  // handle http response error of calling backend API
  if (e.statusCode) {
    if (e.statusCode >= 400 && e.statusCode <= 499) {
      let message = typeof e.body === 'string' ? e.body : JSON.stringify(e.body);
      if (!message) {
        message = e.message;
      }

      return res.customError({
        body: { message: typeof e.body === 'string' ? e.body : JSON.stringify(e.body) },
        statusCode: e.statusCode,
      });
    } else {
      return res.customError({
        statusCode: e.statusCode,
      });
    }
  }

  // Return an general internalError for unhandled server-side issues
  return res.internalError();
};
