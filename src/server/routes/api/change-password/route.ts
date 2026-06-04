/* eslint-disable no-console*/

import { AppRequest, AppResponse } from '@/server/web';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { db } from '@/lib/db';


export async function POST(request: AppRequest) {
  const storageType = process.env.VITE_STORAGE_TYPE || 'localstorage';

  // 不支持 localstorage 模式
  if (storageType === 'localstorage') {
    return AppResponse.json(
      {
        error: '不支持本地存储模式修改密码',
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { newPassword } = body;

    // 获取认证信息
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return AppResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 验证新密码
    if (!newPassword || typeof newPassword !== 'string') {
      return AppResponse.json({ error: '新密码不得为空' }, { status: 400 });
    }

    const username = authInfo.username;

    // 不允许站长修改密码（站长用户名等于 process.env.USERNAME）
    if (username === process.env.USERNAME) {
      return AppResponse.json(
        { error: '站长不能通过此接口修改密码' },
        { status: 403 }
      );
    }

    // 修改密码
    await db.changePassword(username, newPassword);

    return AppResponse.json({ ok: true });
  } catch (error) {
    console.error('修改密码失败:', error);
    return AppResponse.json(
      {
        error: '修改密码失败',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
