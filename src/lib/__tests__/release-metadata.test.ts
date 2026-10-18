import { PRODUCT_NAME } from '@/lib/branding';
import { changelog } from '@/lib/changelog';
import { CURRENT_VERSION } from '@/lib/version';

import packageJson from '../../../package.json';

describe('release metadata', () => {
  it('uses NovaTV-owned version and changelog data', () => {
    expect(CURRENT_VERSION).toBe('9.0.0');
    expect(packageJson.version).toBe(CURRENT_VERSION);
    expect(changelog[0]).toMatchObject({
      version: CURRENT_VERSION,
      date: '2026-06-25',
    });

    const serializedChangelog = JSON.stringify(changelog);
    expect(serializedChangelog).toContain(PRODUCT_NAME);
    expect(changelog.some((entry) => entry.version === '8.9.5')).toBe(false);
  });
});
