import { AppRequest, AppResponse } from '@/server/web';

import { getCachedLiveChannels } from '@/lib/live';


export async function GET(request: AppRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceKey = searchParams.get('source');

    if (!sourceKey) {
      return AppResponse.json({ error: '缺少直播源参数' }, { status: 400 });
    }

    const channelData = await getCachedLiveChannels(sourceKey);

    if (!channelData) {
      return AppResponse.json({ error: '频道信息未找到' }, { status: 404 });
    }

    return AppResponse.json({
      success: true,
      data: channelData.channels
    });
  } catch (error) {
    return AppResponse.json(
      { error: '获取频道信息失败' },
      { status: 500 }
    );
  }
}
