import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';

import type { FastifyInstance, FastifyReply } from 'fastify';

import type { AppRequest } from './web';
import { createAppRequest, runWithRequestContext } from './web';

type RouteModule = Record<string, unknown>;
type RouteHandler = (request: AppRequest) => Promise<Response> | Response;

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;

export function registerWebRouteModule(
  app: FastifyInstance,
  path: string,
  routeModule: RouteModule
) {
  for (const method of METHODS) {
    const handler = routeModule[method] as RouteHandler | undefined;
    if (!handler) continue;

    app.route({
      method,
      url: path,
      exposeHeadRoute: method === 'GET' ? false : undefined,
      handler: async (request, reply) => {
        const appRequest = createAppRequest(request);
        const response = await runWithRequestContext(request, appRequest, () =>
          handler(appRequest)
        );
        return sendWebResponse(reply, response);
      },
    });
  }
}

function sendWebResponse(reply: FastifyReply, response: Response) {
  reply.status(response.status);

  const setCookies = getSetCookies(response.headers);
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') {
      reply.header(key, value);
    }
  });
  for (const cookie of setCookies) {
    reply.header('set-cookie', cookie);
  }

  if (!response.body) {
    return reply.send();
  }

  return reply.send(
    Readable.fromWeb(response.body as unknown as NodeReadableStream<Uint8Array>)
  );
}

function getSetCookies(headers: Headers) {
  const maybeHeaders = headers as Headers & { getSetCookie?: () => string[] };
  const cookies = maybeHeaders.getSetCookie?.();
  if (cookies?.length) return cookies;
  const single = headers.get('set-cookie');
  return single ? [single] : [];
}
