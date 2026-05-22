#!/usr/bin/env node
/* eslint-disable no-console */

const { spawn, spawnSync } = require('child_process');
const net = require('net');

function getRedisConfig(env = process.env) {
  return {
    containerName: env.REDIS_CONTAINER_NAME || 'orangetv-redis-dev',
    image: env.REDIS_IMAGE || 'redis:alpine',
    port: env.REDIS_PORT || '6379',
  };
}

function buildRedisUrl(port) {
  return `redis://localhost:${port}`;
}

function resolveRedisAction(state) {
  if (!state.exists) return 'create';
  if (!state.running) return 'start';
  return 'none';
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port);
  });
}

async function assertDevPortsAvailable(ports = [3000, 3001]) {
  const checks = await Promise.all(
    ports.map(async (port) => ({
      port,
      available: await isPortAvailable(port),
    }))
  );
  const blocked = checks.filter((check) => !check.available);

  if (blocked.length > 0) {
    throw new Error(
      `Dev port${blocked.length > 1 ? 's are' : ' is'} already in use: ${blocked
        .map((check) => check.port)
        .join(', ')}.\nStop the existing OrangeTV dev server or free those ports, then retry.`
    );
  }
}

function runDocker(args, options = {}) {
  return spawnSync('docker', args, {
    encoding: 'utf8',
    stdio: options.stdio || 'pipe',
  });
}

function assertDockerAvailable() {
  const result = runDocker(['info']);
  if (result.status !== 0) {
    const detail = result.stderr?.trim() || result.stdout?.trim();
    throw new Error(
      `Docker is not available. Start Docker Desktop and retry.\n${detail || ''}`
    );
  }
}

function getContainerState(containerName) {
  const result = runDocker([
    'inspect',
    '-f',
    '{{.State.Running}}',
    containerName,
  ]);

  if (result.status !== 0) {
    return { exists: false, running: false };
  }

  return {
    exists: true,
    running: result.stdout.trim() === 'true',
  };
}

function ensureRedis(config = getRedisConfig()) {
  assertDockerAvailable();

  const state = getContainerState(config.containerName);
  const action = resolveRedisAction(state);

  if (action === 'none') {
    console.log(`Redis container "${config.containerName}" is already running.`);
    return;
  }

  if (action === 'start') {
    console.log(`Starting Redis container "${config.containerName}"...`);
    const result = runDocker(['start', config.containerName], {
      stdio: 'inherit',
    });
    if (result.status !== 0) {
      throw new Error(`Failed to start Redis container "${config.containerName}".`);
    }
    return;
  }

  console.log(
    `Creating Redis container "${config.containerName}" on localhost:${config.port}...`
  );
  const result = runDocker(
    [
      'run',
      '--name',
      config.containerName,
      '-p',
      `${config.port}:6379`,
      '-d',
      config.image,
    ],
    { stdio: 'inherit' }
  );

  if (result.status !== 0) {
    throw new Error(
      `Failed to create Redis container. If port ${config.port} is already in use, retry with REDIS_PORT=6380 pnpm dev:redis.`
    );
  }
}

function startNextDev(config = getRedisConfig()) {
  const redisUrl = buildRedisUrl(config.port);
  const env = {
    ...process.env,
    NEXT_PUBLIC_STORAGE_TYPE: 'redis',
    REDIS_URL: redisUrl,
  };

  console.log(`Using Redis storage: ${redisUrl}`);
  console.log('Starting OrangeTV dev server...');

  const child = spawn('pnpm', ['dev'], {
    env,
    stdio: 'inherit',
  });

  process.on('SIGINT', () => {
    if (!child.killed) child.kill('SIGINT');
  });
  process.on('SIGTERM', () => {
    if (!child.killed) child.kill('SIGTERM');
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.exit(1);
    }
    process.exit(code || 0);
  });
}

async function main() {
  try {
    const config = getRedisConfig();
    await assertDevPortsAvailable();
    ensureRedis(config);
    startNextDev(config);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  assertDevPortsAvailable,
  buildRedisUrl,
  ensureRedis,
  getRedisConfig,
  isPortAvailable,
  resolveRedisAction,
};
