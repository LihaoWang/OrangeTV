export {};

declare global {
  interface Window {
    RUNTIME_CONFIG?: {
      STORAGE_TYPE?: string;
      SITE_NAME?: string;
      ANNOUNCEMENT?: string;
      DOUBAN_PROXY_TYPE?: string;
      DOUBAN_PROXY?: string;
      DOUBAN_IMAGE_PROXY_TYPE?: string;
      DOUBAN_IMAGE_PROXY?: string;
      DISABLE_YELLOW_FILTER?: boolean;
      CUSTOM_CATEGORIES?: { name: string; type: 'movie' | 'tv'; query: string }[];
      FLUID_SEARCH?: boolean;
      REQUIRE_DEVICE_CODE?: boolean;
    };
  }
}
