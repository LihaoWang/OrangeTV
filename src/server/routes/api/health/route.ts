import { AppResponse } from '@/server/web';

export async function GET() {
  return AppResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Fastify server is running'
  });
}
