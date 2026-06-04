/* eslint-disable no-console */

import { AppRequest, AppResponse } from '@/server/web';

import { getConfig } from '@/lib/config';
import { CURRENT_VERSION } from '@/lib/version'


export async function GET(request: AppRequest) {
  console.log('server-config called: ', request.url);

  const config = await getConfig();
  const result = {
    SiteName: config.SiteConfig.SiteName,
    StorageType: process.env.VITE_STORAGE_TYPE || 'localstorage',
    Version: CURRENT_VERSION,
  };
  return AppResponse.json(result);
}
