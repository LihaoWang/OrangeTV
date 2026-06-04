import { getConfig } from '@/lib/config';

export async function getRuntimeConfig() {
  const storageType = process.env.VITE_STORAGE_TYPE || 'localstorage';
  let siteName = process.env.VITE_SITE_NAME || 'OrangeTV';
  let announcement =
    process.env.ANNOUNCEMENT ||
    '本网站仅提供影视信息搜索服务，所有内容均来自第三方网站。本站不存储任何视频资源，不对任何内容的准确性、合法性、完整性负责。';
  let doubanProxyType =
    process.env.VITE_DOUBAN_PROXY_TYPE || 'cmliussss-cdn-tencent';
  let doubanProxy = process.env.VITE_DOUBAN_PROXY || '';
  let doubanImageProxyType =
    process.env.VITE_DOUBAN_IMAGE_PROXY_TYPE || 'cmliussss-cdn-tencent';
  let doubanImageProxy = process.env.VITE_DOUBAN_IMAGE_PROXY || '';
  let disableYellowFilter =
    process.env.VITE_DISABLE_YELLOW_FILTER === 'true';
  let fluidSearch = process.env.VITE_FLUID_SEARCH !== 'false';
  let requireDeviceCode =
    process.env.VITE_REQUIRE_DEVICE_CODE !== 'false';
  let customCategories: { name: string; type: 'movie' | 'tv'; query: string }[] =
    [];

  if (storageType !== 'localstorage') {
    const config = await getConfig();
    siteName = config.SiteConfig.SiteName;
    announcement = config.SiteConfig.Announcement;
    doubanProxyType = config.SiteConfig.DoubanProxyType;
    doubanProxy = config.SiteConfig.DoubanProxy;
    doubanImageProxyType = config.SiteConfig.DoubanImageProxyType;
    doubanImageProxy = config.SiteConfig.DoubanImageProxy;
    disableYellowFilter = config.SiteConfig.DisableYellowFilter;
    fluidSearch = config.SiteConfig.FluidSearch;
    requireDeviceCode = config.SiteConfig.RequireDeviceCode;
    customCategories = config.CustomCategories.filter(
      (category) => !category.disabled
    ).map((category) => ({
      name: category.name || '',
      type: category.type,
      query: category.query,
    }));
  }

  return {
    STORAGE_TYPE: storageType,
    SITE_NAME: siteName,
    ANNOUNCEMENT: announcement,
    DOUBAN_PROXY_TYPE: doubanProxyType,
    DOUBAN_PROXY: doubanProxy,
    DOUBAN_IMAGE_PROXY_TYPE: doubanImageProxyType,
    DOUBAN_IMAGE_PROXY: doubanImageProxy,
    DISABLE_YELLOW_FILTER: disableYellowFilter,
    CUSTOM_CATEGORIES: customCategories,
    FLUID_SEARCH: fluidSearch,
    REQUIRE_DEVICE_CODE: requireDeviceCode,
  };
}

export async function renderRuntimeConfigScript() {
  const config = await getRuntimeConfig();
  return `window.RUNTIME_CONFIG = ${JSON.stringify(config)};`;
}
