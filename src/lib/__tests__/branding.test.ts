import {
  ATTRIBUTION_NAME,
  GHCR_IMAGE_NAME,
  LEGACY_PRODUCT_NAME,
  PRODUCT_NAME,
  REPO_RAW_CHANGELOG_URL,
  REPO_RAW_VERSION_URL,
  REPO_URL,
} from '@/lib/branding';

describe('branding constants', () => {
  it('defines NovaTV product branding and current repository endpoints', () => {
    expect(PRODUCT_NAME).toBe('NovaTV');
    expect(LEGACY_PRODUCT_NAME).toBe('OrangeTV');
    expect(ATTRIBUTION_NAME).toBe('OrangeTV');
    expect(REPO_URL).toBe('https://github.com/LihaoWang/OrangeTV');
    expect(REPO_RAW_VERSION_URL).toBe(
      'https://raw.githubusercontent.com/LihaoWang/OrangeTV/refs/heads/main/VERSION.txt'
    );
    expect(REPO_RAW_CHANGELOG_URL).toBe(
      'https://raw.githubusercontent.com/LihaoWang/OrangeTV/refs/heads/main/CHANGELOG'
    );
    expect(GHCR_IMAGE_NAME).toBe('ghcr.io/lihaowang/novatv');
  });
});
