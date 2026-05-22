const {
  buildRedisUrl,
  getRedisConfig,
  isPortAvailable,
  resolveRedisAction,
} = require('../dev-with-redis');
const net = require('net');

describe('dev-with-redis helpers', () => {
  test('uses stable defaults for the local Redis container', () => {
    const config = getRedisConfig({});

    expect(config).toEqual({
      containerName: 'orangetv-redis-dev',
      image: 'redis:alpine',
      port: '6379',
    });
  });

  test('allows env overrides for container name, image, and port', () => {
    const config = getRedisConfig({
      REDIS_CONTAINER_NAME: 'custom-redis',
      REDIS_IMAGE: 'redis:7-alpine',
      REDIS_PORT: '6380',
    });

    expect(config).toEqual({
      containerName: 'custom-redis',
      image: 'redis:7-alpine',
      port: '6380',
    });
  });

  test('builds the Redis URL passed to the Next.js dev process', () => {
    expect(buildRedisUrl('6380')).toBe('redis://localhost:6380');
  });

  test('starts an existing stopped container instead of creating it', () => {
    expect(resolveRedisAction({ exists: true, running: false })).toBe('start');
  });

  test('does nothing when the container is already running', () => {
    expect(resolveRedisAction({ exists: true, running: true })).toBe('none');
  });

  test('creates the container when it does not exist', () => {
    expect(resolveRedisAction({ exists: false, running: false })).toBe('create');
  });

  test('detects when a dev port is already occupied', async () => {
    const server = net.createServer();

    await new Promise((resolve) => server.listen(0, resolve));
    const { port } = server.address();

    try {
      await expect(isPortAvailable(port)).resolves.toBe(false);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
