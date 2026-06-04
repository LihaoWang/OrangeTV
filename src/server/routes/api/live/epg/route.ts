import { AppRequest, AppResponse } from '@/server/web';

import { getCachedLiveChannels } from '@/lib/live';


export async function GET(request: AppRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceKey = searchParams.get('source');
    const tvgId = searchParams.get('tvgId');

    if (!sourceKey) {
      return AppResponse.json({ error: '缺少直播源参数' }, { status: 400 });
    }

    if (!tvgId) {
      return AppResponse.json({ error: '缺少频道tvg-id参数' }, { status: 400 });
    }

    const channelData = await getCachedLiveChannels(sourceKey);

    if (!channelData) {
      // 频道信息未找到时返回空的节目单数据
      return AppResponse.json({
        success: true,
        data: {
          tvgId,
          source: sourceKey,
          epgUrl: '',
          programs: []
        }
      });
    }

    // 从epgs字段中获取对应tvgId的节目单信息
    const epgData = channelData.epgs[tvgId] || [];

    return AppResponse.json({
      success: true,
      data: {
        tvgId,
        source: sourceKey,
        epgUrl: channelData.epgUrl,
        programs: epgData
      }
    });
  } catch (error) {
    return AppResponse.json(
      { error: '获取节目单信息失败' },
      { status: 500 }
    );
  }
}
