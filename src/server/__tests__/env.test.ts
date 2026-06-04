import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { loadEnvFiles } from '../env';

describe('loadEnvFiles', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('loads local env defaults without overriding existing process env', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orangetv-env-'));
    fs.writeFileSync(
      path.join(tmp, '.env.local'),
      [
        'USERNAME=admin',
        'PASSWORD=orangetv-local-dev',
        'VITE_STORAGE_TYPE=localstorage',
      ].join('\n')
    );

    delete process.env.USERNAME;
    delete process.env.PASSWORD;
    process.env.VITE_STORAGE_TYPE = 'redis';

    loadEnvFiles({ cwd: tmp, nodeEnv: 'development' });

    expect(process.env.USERNAME).toBe('admin');
    expect(process.env.PASSWORD).toBe('orangetv-local-dev');
    expect(process.env.VITE_STORAGE_TYPE).toBe('redis');
  });
});
