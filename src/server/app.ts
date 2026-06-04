import fs from 'node:fs';
import path from 'node:path';

import fastifyCookie from '@fastify/cookie';
import fastifyMiddie from '@fastify/middie';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import type { ViteDevServer } from 'vite';

import { isAuthenticated, shouldSkipAuth } from './auth';
import { renderRuntimeConfigScript } from './runtime-config';
import { apiRoutes } from './routes';
import { registerWebRouteModule } from './web-route';

export interface CreateAppOptions {
  dev?: boolean;
  clientDist?: string | null;
}

export async function createApp(options: CreateAppOptions = {}) {
  const app = Fastify({ logger: true });
  const dev = options.dev ?? process.env.NODE_ENV !== 'production';
  const clientDist =
    options.clientDist === undefined
      ? path.resolve(process.cwd(), 'dist/client')
      : options.clientDist;
  let vite: ViteDevServer | null = null;

  await app.register(fastifyCookie);
  await app.register(fastifyMiddie);

  app.addHook('onRequest', async (request, reply) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (shouldSkipAuth(pathname)) return;
    if (await isAuthenticated(request)) return;

    if (pathname.startsWith('/api')) {
      reply.code(401).send('Unauthorized');
      return reply;
    }

    const redirect = `${pathname}${new URL(request.url, 'http://localhost').search}`;
    reply.redirect(`/login?redirect=${encodeURIComponent(redirect)}`);
    return reply;
  });

  app.get('/runtime-config.js', async (_request, reply) => {
    reply.type('application/javascript; charset=utf-8');
    return renderRuntimeConfigScript();
  });

  for (const route of apiRoutes) {
    registerWebRouteModule(app, route.path, route.module);
  }

  if (dev) {
    const { createServer } = await import('vite');
    vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use((request, response, next) => {
      const requestUrl = request.url || '/';
      if (
        requestUrl.startsWith('/api/') ||
        requestUrl.startsWith('/runtime-config.js')
      ) {
        next();
        return;
      }
      vite!.middlewares(request, response, next);
    });
  } else if (clientDist && fs.existsSync(clientDist)) {
    await app.register(fastifyStatic, {
      root: clientDist,
      wildcard: false,
    });
  }

  app.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith('/api/')) {
      reply.code(404).send({ error: 'Not Found' });
      return;
    }

    reply.type('text/html; charset=utf-8');

    if (dev && vite) {
      const template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
      return vite.transformIndexHtml(request.url, template);
    }

    const indexPath =
      clientDist && fs.existsSync(path.join(clientDist, 'index.html'))
        ? path.join(clientDist, 'index.html')
        : path.resolve(process.cwd(), 'index.html');
    return fs.readFileSync(indexPath, 'utf-8');
  });

  app.addHook('onClose', async () => {
    await vite?.close();
  });

  return app;
}
