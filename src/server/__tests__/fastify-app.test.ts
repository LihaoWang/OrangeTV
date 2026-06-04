/**
 * @jest-environment node
 */

import type { createApp as createAppType } from '@/server/app';

describe('Fastify app shell', () => {
  let createApp: typeof createAppType;

  beforeAll(async () => {
    const { Blob, File } = await import('node:buffer');
    const { ReadableStream, TransformStream } = await import('node:stream/web');
    const { MessageChannel, MessagePort } = await import('node:worker_threads');
    Object.assign(globalThis, {
      Blob,
      DOMException: class DOMException extends Error {
        constructor(message?: string, public name = 'DOMException') {
          super(message);
        }
      },
      File,
      MessageChannel,
      MessagePort,
      ReadableStream,
      TransformStream,
    });
    const { FormData, Headers, Request, Response } = await import('undici');
    Object.assign(globalThis, { FormData, Headers, Request, Response });
    const appModule = await import('@/server/app');
    createApp = appModule.createApp;
  });

  beforeEach(() => {
    process.env.PASSWORD = 'secret';
    process.env.USERNAME = 'owner';
    process.env.VITE_STORAGE_TYPE = 'redis';
    process.env.REDIS_URL = 'redis://localhost:6379';
  });

  it('serves health and runtime config without authentication', async () => {
    const app = await createApp({ dev: false, clientDist: null });

    const health = await app.inject('/api/health');
    expect(health.statusCode).toBe(200);
    expect(health.json()).toMatchObject({
      status: 'ok',
      timestamp: expect.any(String),
    });

    const runtimeConfig = await app.inject('/runtime-config.js');
    expect(runtimeConfig.statusCode).toBe(200);
    expect(runtimeConfig.headers['content-type']).toContain('application/javascript');
    expect(runtimeConfig.body).toContain('window.RUNTIME_CONFIG');
    expect(runtimeConfig.body).toContain('"STORAGE_TYPE":"redis"');

    await app.close();
  });

  it('redirects protected browser routes to login and serves the SPA when authenticated', async () => {
    process.env.VITE_STORAGE_TYPE = 'localstorage';
    const app = await createApp({ dev: false, clientDist: null });
    const auth = encodeURIComponent(JSON.stringify({ password: 'secret', role: 'user' }));

    const unauthenticated = await app.inject('/admin');
    expect(unauthenticated.statusCode).toBe(302);
    expect(unauthenticated.headers.location).toBe('/login?redirect=%2Fadmin');

    const authenticated = await app.inject({
      method: 'GET',
      url: '/play?id=abc',
      headers: {
        cookie: `auth=${auth}`,
      },
    });
    expect(authenticated.statusCode).toBe(200);
    expect(authenticated.headers['content-type']).toContain('text/html');
    expect(authenticated.body).toContain('<div id="root"></div>');

    await app.close();
  });
});
