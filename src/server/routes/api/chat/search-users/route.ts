import { AppRequest, AppResponse } from '@/server/web';
import { db } from '@/lib/db';
import { getAuthInfoFromCookie } from '@/lib/auth';

export async function GET(request: AppRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return AppResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return AppResponse.json({ error: '搜索关键词至少需要2个字符' }, { status: 400 });
    }

    // 获取所有用户并进行模糊匹配
    const allUsers = await db.getAllUsers();
    const matchedUsers = allUsers.filter(username =>
      username.toLowerCase().includes(query.toLowerCase()) &&
      username !== authInfo.username // 排除自己
    );

    // 转换为Friend格式返回
    const userResults = matchedUsers.map(username => ({
      id: username,
      username,
      status: 'offline' as const,
      added_at: 0,
    }));

    return AppResponse.json(userResults);
  } catch (error) {
    console.error('Error searching users:', error);
    return AppResponse.json({ error: '搜索用户失败' }, { status: 500 });
  }
}
