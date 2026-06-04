import { AppRequest, AppResponse } from '@/server/web';
import { db } from '@/lib/db';
import { Friend } from '@/lib/types';
import { getAuthInfoFromCookie } from '@/lib/auth';

export async function GET(request: AppRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return AppResponse.json({ error: '未授权' }, { status: 401 });
    }

    const friends = await db.getFriends(authInfo.username);
    return AppResponse.json(friends);
  } catch (error) {
    console.error('Error loading friends:', error);
    return AppResponse.json({ error: '获取好友列表失败' }, { status: 500 });
  }
}

export async function POST(request: AppRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return AppResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { username, nickname } = await request.json();

    if (!username) {
      return AppResponse.json({ error: '用户名不能为空' }, { status: 400 });
    }

    // 检查用户是否存在
    const userExists = await db.checkUserExist(username);
    if (!userExists) {
      return AppResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 检查是否已经是好友
    const friends = await db.getFriends(authInfo.username);
    const isAlreadyFriend = friends.some(friend => friend.username === username);
    if (isAlreadyFriend) {
      return AppResponse.json({ error: '已经是好友' }, { status: 400 });
    }

    const friend: Friend = {
      id: `friend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username,
      nickname,
      status: 'offline',
      added_at: Date.now(),
    };

    await db.addFriend(authInfo.username, friend);
    return AppResponse.json(friend, { status: 201 });
  } catch (error) {
    console.error('Error adding friend:', error);
    return AppResponse.json({ error: '添加好友失败' }, { status: 500 });
  }
}

export async function DELETE(request: AppRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return AppResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get('friendId');

    if (!friendId) {
      return AppResponse.json({ error: '好友 ID 不能为空' }, { status: 400 });
    }

    await db.removeFriend(authInfo.username, friendId);
    return AppResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing friend:', error);
    return AppResponse.json({ error: '删除好友失败' }, { status: 500 });
  }
}
