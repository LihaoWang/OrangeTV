import type { AdminConfig } from '@/lib/admin.types';
import { configSelfCheck } from '@/lib/config';

function buildConfig(siteName?: string): AdminConfig {
  return {
    ConfigFile: '',
    ConfigSubscribtion: {
      AutoUpdate: false,
      LastCheck: '',
      URL: '',
    },
    CustomCategories: [],
    SiteConfig: {
      Announcement: '',
      DisableYellowFilter: false,
      DoubanImageProxy: '',
      DoubanImageProxyType: 'direct',
      DoubanProxy: '',
      DoubanProxyType: 'direct',
      FluidSearch: true,
      RequireDeviceCode: false,
      SearchDownstreamMaxPage: 5,
      SiteInterfaceCacheTime: 7200,
      SiteName: siteName ?? 'NovaTV',
    },
    SourceConfig: [],
    UserConfig: {
      Users: [],
    },
  };
}

describe('config branding defaults', () => {
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

  it('uses NovaTV when SiteConfig is missing', () => {
    const config = buildConfig();
    delete (config as Partial<AdminConfig>).SiteConfig;

    expect(configSelfCheck(config).SiteConfig.SiteName).toBe('NovaTV');
  });

  it('migrates the legacy OrangeTV default site name to NovaTV', () => {
    const config = buildConfig('OrangeTV');

    expect(configSelfCheck(config).SiteConfig.SiteName).toBe('NovaTV');
  });

  it('preserves custom site names', () => {
    process.env.VITE_SITE_NAME = 'EnvironmentTV';
    const config = buildConfig('My Home Theater');

    expect(configSelfCheck(config).SiteConfig.SiteName).toBe('My Home Theater');
  });

  it('uses the environment default when migrating the legacy site name', () => {
    process.env.VITE_SITE_NAME = 'EnvironmentTV';

    expect(configSelfCheck(buildConfig('OrangeTV')).SiteConfig.SiteName).toBe(
      'EnvironmentTV'
    );
  });
});
