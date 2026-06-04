import type { FastifyRequest } from 'fastify';

import { getAuthCookie } from './auth';

export function getAuthContext(request: FastifyRequest) {
  return getAuthCookie(request);
}
