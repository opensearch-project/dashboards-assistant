/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Auth,
  AuthenticationData,
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRealm,
  ServerStateCookieOptions,
} from '@hapi/hapi';
// @ts-ignore
import Response from '@hapi/hapi/lib/response';
import { ProxyHandlerOptions } from '@hapi/h2o2';
import { ReplyFileHandlerOptions } from '@hapi/inert';
import { httpServerMock } from '../../../../src/core/server/http/http_server.mocks';
import {
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsResponseFactory,
  RouteMethod,
  Router,
} from '../../../../src/core/server/http/router';
import { CoreRouteHandlerContext } from '../../../../src/core/server/core_route_handler_context';
import { coreMock } from '../../../../src/core/server/mocks';
import { ContextEnhancer } from '../../../../src/core/server/http/router/router';

/**
 * For hapi, ResponseToolkit is an internal implementation
 * so we have to create a MockResponseToolkit to mock the behavior.
 * This class should be put under OSD core,
 */
export class MockResponseToolkit implements ResponseToolkit {
  abandon: symbol = Symbol('abandon');
  close: symbol = Symbol('close');
  context: unknown;
  continue: symbol = Symbol('continue');
  realm: ServerRealm = {
    modifiers: {
      route: {
        prefix: '',
        vhost: '',
      },
    },
    parent: null,
    plugin: '',
    pluginOptions: {},
    plugins: [],
    settings: {
      files: {
        relativeTo: '',
      },
      bind: {},
    },
  };
  request: Readonly<Request> = httpServerMock.createRawRequest();
  authenticated(): Auth {
    throw new Error('Method not implemented.');
  }
  entity(
    options?:
      | { etag?: string | undefined; modified?: string | undefined; vary?: boolean | undefined }
      | undefined
  ): ResponseObject | undefined {
    throw new Error('Method not implemented.');
  }
  redirect(uri?: string | undefined): ResponseObject {
    throw new Error('Method not implemented.');
  }
  state(
    name: string,
    value: string | object,
    options?: ServerStateCookieOptions | undefined
  ): void {
    throw new Error('Method not implemented.');
  }
  unauthenticated(error: Error, data?: AuthenticationData | undefined): void {
    throw new Error('Method not implemented.');
  }
  unstate(name: string, options?: ServerStateCookieOptions | undefined): void {
    throw new Error('Method not implemented.');
  }
  file(path: string, options?: ReplyFileHandlerOptions | undefined): ResponseObject {
    throw new Error('Method not implemented.');
  }
  proxy(options: ProxyHandlerOptions): Promise<ResponseObject> {
    throw new Error('Method not implemented.');
  }
  response(payload: unknown) {
    return new Response(payload);
  }
}

const enhanceWithContext = (((otherContext?: object) => (fn: (...args: unknown[]) => unknown) => (
  req: OpenSearchDashboardsRequest,
  res: OpenSearchDashboardsResponseFactory
) => {
  const context = new CoreRouteHandlerContext(coreMock.createInternalStart(), req);
  return fn.call(
    null,
    {
      core: context,
      ...otherContext,
    },
    req,
    res
  );
}) as unknown) as (
  otherContext?: object
) => ContextEnhancer<unknown, unknown, unknown, RouteMethod>;

const triggerHandler = async (
  router: Router,
  options: {
    method: string;
    path: string;
    req: Request;
  }
) => {
  const allRoutes = router.getRoutes();
  const findRoute = allRoutes.find(
    (item) => item.method === options.method && item.path === options.path
  );
  return await findRoute?.handler(options.req, new MockResponseToolkit());
};

export { enhanceWithContext, triggerHandler };
