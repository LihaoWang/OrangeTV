/* eslint-disable no-console */

import { AppRequest, AppResponse } from '@/server/web';

import { getConfig } from '@/lib/config';


export async function GET(request: AppRequest) {
  console.log(request.url)
  try {
    const config = await getConfig();

    if (!config) {
      return AppResponse.json({ error: '配置未找到' }, { status: 404 });
    }

    // 过滤出所有非 disabled 的直播源
    const liveSources = (config.LiveConfig || []).filter(source => !source.disabled);

    return AppResponse.json({
      success: true,
      data: liveSources
    });
  } catch (error) {
    console.error('获取直播源失败:', error);
    return AppResponse.json(
      { error: '获取直播源失败' },
      { status: 500 }
    );
  }
}
