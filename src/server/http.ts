import { AppResponse } from './web';

export { AppResponse, type AppRequest } from './web';

export function json(data: unknown, init: ResponseInit = {}) {
  return AppResponse.json(data, init);
}

export function error(message: string, status = 500) {
  return AppResponse.json({ error: message }, { status });
}
