import { AsyncLocalStorage } from 'node:async_hooks';

import type { FastifyRequest } from 'fastify';

export type AppRequest = Request & {
  cookies: {
    get(name: string): { name: string; value: string } | undefined;
  };
};

type CookieOptions = {
  path?: string;
  expires?: Date;
  maxAge?: number;
  sameSite?: 'strict' | 'lax' | 'none' | boolean;
  httpOnly?: boolean;
  secure?: boolean;
};

type RequestContext = {
  request: FastifyRequest;
  appRequest: AppRequest;
};

const requestContext = new AsyncLocalStorage<RequestContext>();

export class AppResponse extends Response {
  cookies = {
    set: (name: string, value: string, options: CookieOptions = {}) => {
      this.headers.append('set-cookie', serializeCookie(name, value, options));
    },
  };

  static json(data: unknown, init: ResponseInit = {}) {
    const headers = new Headers(init.headers);
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    return new AppResponse(JSON.stringify(data), {
      ...init,
      headers,
    });
  }
}

export function createAppRequest(request: FastifyRequest): AppRequest {
  const protocol = request.headers['x-forwarded-proto'] || 'http';
  const host = request.headers.host || 'localhost:3000';
  const url = `${protocol}://${host}${request.url}`;
  const headers = new Headers();

  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      headers.set(key, value.join(', '));
    } else if (value !== undefined) {
      headers.set(key, String(value));
    }
  }

  const method = request.method.toUpperCase();
  const body =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : serializeBody(request.body, headers);

  const webRequest = new Request(url, { method, headers, body });
  return Object.assign(webRequest, {
    cookies: cookieReader(request),
  });
}

export function runWithRequestContext<T>(
  request: FastifyRequest,
  appRequest: AppRequest,
  callback: () => T
) {
  return requestContext.run({ request, appRequest }, callback);
}

export async function cookies() {
  const context = getRequestContext();
  return {
    get: (name: string) => context.appRequest.cookies.get(name),
  };
}

export async function headers() {
  const context = getRequestContext();
  return context.appRequest.headers;
}

function getRequestContext() {
  const context = requestContext.getStore();
  if (!context) {
    throw new Error('Request context is unavailable');
  }
  return context;
}

function cookieReader(request: FastifyRequest) {
  return {
    get: (name: string) => {
      const value = request.cookies?.[name];
      return value === undefined ? undefined : { name, value };
    },
  };
}

function serializeBody(body: unknown, headers: Headers) {
  if (body === undefined || body === null) return undefined;
  if (typeof body === 'string' || body instanceof FormData) return body;
  if (body instanceof ArrayBuffer || body instanceof Uint8Array) {
    return body as BodyInit;
  }
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  return JSON.stringify(body);
}

function serializeCookie(name: string, value: string, options: CookieOptions) {
  const parts = [`${name}=${value}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) {
    const sameSite =
      typeof options.sameSite === 'string'
        ? options.sameSite
        : options.sameSite === true
          ? 'strict'
          : undefined;
    if (sameSite) parts.push(`SameSite=${sameSite}`);
  }
  return parts.join('; ');
}
