import { REPO_RAW_VERSION_URL } from '@/lib/branding';
import { CURRENT_VERSION } from '@/lib/version';
import {
  checkForUpdates,
  compareVersions,
  UpdateStatus,
} from '@/lib/version_check';

describe('version check branding', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches version information from the current project repository', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => CURRENT_VERSION,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(checkForUpdates()).resolves.toBe(UpdateStatus.NO_UPDATE);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain(REPO_RAW_VERSION_URL);
  });

  it('does not treat inherited OrangeTV 8.x metadata as a NovaTV update', () => {
    expect(CURRENT_VERSION).toBe('9.0.0');
    expect(compareVersions('8.9.5')).toBe(UpdateStatus.NO_UPDATE);
  });
});
