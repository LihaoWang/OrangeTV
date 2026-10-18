/* eslint-env jest */

const { createManifest } = require('../generate-manifest');

describe('generate-manifest helpers', () => {
  const originalSiteName = process.env.VITE_SITE_NAME;

  beforeEach(() => {
    delete process.env.VITE_SITE_NAME;
  });

  afterEach(() => {
    if (originalSiteName === undefined) {
      delete process.env.VITE_SITE_NAME;
    } else {
      process.env.VITE_SITE_NAME = originalSiteName;
    }
  });

  test('uses NovaTV as the default manifest name', () => {
    const manifest = createManifest();

    expect(manifest.name).toBe('NovaTV');
    expect(manifest.short_name).toBe('NovaTV');
  });

  test('allows overriding the manifest name from environment', () => {
    process.env.VITE_SITE_NAME = 'CustomTV';
    const manifest = createManifest();

    expect(manifest.name).toBe('CustomTV');
    expect(manifest.short_name).toBe('CustomTV');
  });

  test('allows an explicit manifest name to override the environment', () => {
    process.env.VITE_SITE_NAME = 'EnvironmentTV';
    const manifest = createManifest('CustomTV');

    expect(manifest.name).toBe('CustomTV');
    expect(manifest.short_name).toBe('CustomTV');
  });
});
