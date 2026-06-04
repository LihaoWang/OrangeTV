import { AppRequest, AppResponse } from '@/server/web';
import { db } from '@/lib/db';
import { FriendRequest, Friend } from '@/lib/types';
import { getAuthInfoFromCookie } from '@/lib/auth';

export async function GET(request: AppRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return AppResponse.json({ error: '未授权' }, { status: 401 });
    }

    const friendRequests = await db.getFriendRequests(authInfo.username);
    return AppResponse.json(friendRequests);
  } catch (error) {
    console.error('Error loading friend requests:', error);
    return AppResponse.json({ error: '获取好友申请失败' }, { status: 500 });
  }
}

export async function POST(request: AppRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return AppResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { to_user, message } = await request.json();

    if (!to_user) {
      return AppResponse.json({ error: '目标用户不能为空' }, { status: 400 });
    }

    // 检查目标用户是否存在
    const userExists = await db.checkUserExist(to_user);
    if (!userExists) {
      return AppResponse.json({ error: '目标用户不存在' }, { status: 404 });
    }

    // 检查是否已经是好友
    const friends = await db.getFriends(authInfo.username);
    const isAlreadyFriend = friends.some(friend => friend.username === to_user);
    if (isAlreadyFriend) {
      return AppResponse.json({ error: '已经是好友' }, { status: 400 });
    }

    // 检查是否已经有pending的申请
    const existingRequests = await db.getFriendRequests(to_user);
    const hasPendingRequest = existingRequests.some(
      req => req.from_user === authInfo.username && req.status === 'pending'
    );
    if (hasPendingRequest) {
      return AppResponse.json({ error: '已有待处理的好友申请' }, { status: 400 });
    }

    const friendRequest: FriendRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from_user: authInfo.username,
      to_user,
      message: message || '请求添加您为好友',
      status: 'pending',
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    await db.createFriendRequest(friendRequest);
    return AppResponse.json(friendRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating friend request:', error);
    return AppResponse.json({ error: '发送好友申请失败' }, { status: 500 });
  }
}

export async function PUT(request: AppRequest) {
  try {
    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return AppResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { requestId, status } = await request.json();

    if (!requestId || !status || !['accepted', 'rejected'].includes(status)) {
      return AppResponse.json({ error: '请求参数无效' }, { status: 400 });
    }

    // 获取申请信息
    const allRequests = await db.getFriendRequests(authInfo.username);
    const friendRequest = allRequests.find(req => req.id === requestId && req.to_user === authInfo.username);

    if (!friendRequest) {
      return AppResponse.json({ error: '好友申请不存在' }, { status: 404 });
    }

    if (friendRequest.status !== 'pending') {
      return AppResponse.json({ error: '申请已处理' }, { status: 400 });
    }

    // 更新申请状态
    await db.updateFriendRequest(requestId, status);

    // 如果接受申请，添加为好友
    if (status === 'accepted') {
      const friend1: Friend = {
        id: `friend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: friendRequest.from_user,
        status: 'offline',
        added_at: Date.now(),
      };

      const friend2: Friend = {
        id: `friend_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`,
        username: authInfo.username,
        status: 'offline',
        added_at: Date.now(),
      };

      // 双向添加好友
      await Promise.all([
        db.addFriend(authInfo.username, friend1),
        db.addFriend(friendRequest.from_user, friend2),
      ]);
    }

    return AppResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling friend request:', error);
    return AppResponse.json({ error: '处理好友申请失败' }, { status: 500 });
  }
}
