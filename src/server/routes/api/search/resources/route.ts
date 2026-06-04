/* eslint-disable no-console */

import { AppRequest, AppResponse } from '@/server/web';

import { getAvailableApiSites } from '@/lib/config';


// OrionTV 兼容接口
export async function GET(request: AppRequest) {
  console.log('request', request.url);
  try {
    const apiSites = await getAvailableApiSites();

    return AppResponse.json(apiSites);
  } catch (error) {
    return AppResponse.json({ error: '获取资源失败' }, { status: 500 });
  }
}
