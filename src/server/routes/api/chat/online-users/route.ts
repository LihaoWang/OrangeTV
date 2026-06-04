import { AppRequest, AppResponse } from '@/server/web';
import { getAuthInfoFromCookie } from '@/lib/auth';

// 从全局对象获取WebSocket实例相关方法
function getOnlineUsers(): string[] {
  try {
    if ((global as any).wss) {
      // 假设websocket.js中导出了getOnlineUsers方法并附加到了wss对象上
      return require('../../../../../websocket').getOnlineUsers();
    }
    return [];
  } catch (error) {
    console.error('获取在线用户失败:', error);
    return [];
  }
}

// 获取在线用户列表
export async function GET(request: AppRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return AppResponse.json({ error: '未授权' }, { status: 401 });
    }

    const onlineUsers = getOnlineUsers();
    return AppResponse.json({ onlineUsers });
  } catch (error) {
    console.error('获取在线用户失败:', error);
    return AppResponse.json({ error: '获取在线用户失败' }, { status: 500 });
  }
}
