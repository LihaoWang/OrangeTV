'use client';

import { MessageCircle, Search, Users, X, Send, UserPlus, Smile, Image as ImageIcon, Paperclip } from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Input,
  Label,
  ScrollShadow,
  Spinner,
  TextArea,
  TextField,
} from '@heroui/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { ChatMessage, Conversation, Friend, FriendRequest, WebSocketMessage } from '../lib/types';
import { getAuthInfoFromBrowserCookie } from '../lib/auth';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from './Toast';
import { AppDialog, AppTabs } from './ui/HeroPrimitives';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMessageCountChange?: (count: number) => void;
  onChatCountReset?: (resetCount: number) => void;
  onFriendRequestCountReset?: (resetCount: number) => void;
}

export function ChatModal({
  isOpen,
  onClose,
  onMessageCountChange,
  onChatCountReset,
  onFriendRequestCountReset
}: ChatModalProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'friends'>('chat');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadFriendRequestCount, setUnreadFriendRequestCount] = useState(0);
  const [conversationUnreadCounts, setConversationUnreadCounts] = useState<{ [key: string]: number }>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userAvatars, setUserAvatars] = useState<{ [username: string]: string | null }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = getAuthInfoFromBrowserCookie();
  const { showError, showSuccess } = useToast();

  // 拖动相关事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // 只处理左键
    setIsDragging(true);
    setDragStartPosition({
      x: e.clientX - dragPosition.x,
      y: e.clientY - dragPosition.y
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    setIsDragging(true);
    setDragStartPosition({
      x: touch.clientX - dragPosition.x,
      y: touch.clientY - dragPosition.y
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStartPosition.x;
    const newY = e.clientY - dragStartPosition.y;

    // 允许在全屏范围内拖动，保留边距避免完全移出
    const edgePadding = 40;
    const maxX = window.innerWidth - edgePadding;
    const minX = - (window.innerWidth - edgePadding);
    const maxY = window.innerHeight - edgePadding;
    const minY = - (window.innerHeight - edgePadding);

    setDragPosition({
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY))
    });
  }, [isDragging, dragStartPosition]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    if (!touch) return;

    const newX = touch.clientX - dragStartPosition.x;
    const newY = touch.clientY - dragStartPosition.y;

    const edgePadding = 40;
    const maxX = window.innerWidth - edgePadding;
    const minX = - (window.innerWidth - edgePadding);
    const maxY = window.innerHeight - edgePadding;
    const minY = - (window.innerHeight - edgePadding);

    // 阻止页面滚动
    e.preventDefault();

    setDragPosition({
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY))
    });
  }, [isDragging, dragStartPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 检测屏幕大小
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 添加全局鼠标/触摸事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove as any);
      document.removeEventListener('touchend', handleTouchEnd as any);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // 实时搜索功能
  useEffect(() => {
    const timer = setTimeout(() => {
      if (friendSearchQuery.trim()) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [friendSearchQuery]);

  // 常用表情列表
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝',
    '🤗', '🤔', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮',
    '🤐', '😯', '😴', '😫', '😪', '😵', '🤯', '🤠', '🥳', '😎',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏', '🙌', '👐',
    '❤️', '💙', '💚', '💛', '💜', '🧡', '🖤', '🤍', '🤎', '💕',
    '💖', '💗', '💘', '💝', '💞', '💟', '❣️', '💔', '❤️‍🔥', '💯'
  ];

  // 获取用户真实头像
  const fetchUserAvatar = useCallback(async (username: string) => {
    // 如果已经缓存了该用户的头像（包括 null 值），直接返回
    if (username in userAvatars) {
      return userAvatars[username];
    }

    try {
      const response = await fetch(`/api/avatar?user=${encodeURIComponent(username)}`);
      if (response.ok) {
        const data = await response.json();
        const avatar = data.avatar || null;

        // 缓存头像结果
        setUserAvatars(prev => ({
          ...prev,
          [username]: avatar
        }));

        return avatar;
      }
    } catch (error) {
      console.error('获取用户头像失败:', error);
    }

    // 获取失败时缓存 null
    setUserAvatars(prev => ({
      ...prev,
      [username]: null
    }));

    return null;
  }, [userAvatars]);

  // 预加载用户头像
  const preloadUserAvatars = useCallback(async (usernames: string[]) => {
    const promises = usernames
      .filter(username => !(username in userAvatars)) // 只加载未缓存的头像
      .map(username => fetchUserAvatar(username));

    await Promise.allSettled(promises);
  }, [userAvatars, fetchUserAvatar]);

  // 使用 useCallback 稳定 onMessage 函数引用
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'message':
        const conversationId = message.data.conversation_id;

        // 预加载消息发送者的头像
        if (message.data.sender_id) {
          preloadUserAvatars([message.data.sender_id]);
        }

        // 收到新消息的处理逻辑
        if (selectedConversation && conversationId === selectedConversation.id && isOpen) {
          // 只有当模态框打开且用户正在查看这个对话时，才只刷新消息列表
          loadMessages(selectedConversation.id);
        } else if (conversationId) {
          // 所有其他情况都增加未读消息计数（包括模态框关闭时的当前对话）
          setConversationUnreadCounts(prev => {
            const newCounts = {
              ...prev,
              [conversationId]: (prev[conversationId] || 0) + 1
            };
            return newCounts;
          });

          // 如果用户正在查看这个对话且模态框是打开的，同时刷新消息列表
          if (selectedConversation && conversationId === selectedConversation.id && isOpen) {
            loadMessages(selectedConversation.id);
          }
        }
        loadConversations();
        break;
      case 'friend_request':
        // 收到好友申请

        // 预加载好友申请发送者的头像
        if (message.data.from_user) {
          preloadUserAvatars([message.data.from_user]);
        }

        setUnreadFriendRequestCount(prev => prev + 1);
        loadFriendRequests();
        break;
      case 'friend_accepted':
        // 好友申请被接受
        loadFriends();
        break;
      case 'user_status':
        // 用户状态变化
        setFriends(prevFriends =>
          prevFriends.map(friend =>
            friend.username === message.data.userId
              ? { ...friend, status: message.data.status }
              : friend
          )
        );
        break;
      case 'online_users':
        // 更新在线用户列表
        setOnlineUsers(message.data.users || []);
        break;
      case 'connection_confirmed':
        // 连接确认，请求在线用户列表
        break;
      default:
        break;
    }
  }, [selectedConversation, preloadUserAvatars]);

  // WebSocket 连接 - 始终保持连接以接收实时消息
  const { isConnected, sendMessage: sendWebSocketMessage } = useWebSocket({
    onMessage: handleWebSocketMessage,
    enabled: true, // 始终启用WebSocket以接收实时消息
  });

  useEffect(() => {
    if (isOpen) {
      loadConversations();
      loadFriends();
      loadFriendRequests();

      // 预加载当前用户的头像
      if (currentUser?.username) {
        preloadUserAvatars([currentUser.username]);
      }

      // 开发模式下创建一些测试数据
      if (process.env.NODE_ENV === 'development') {
        createTestDataIfNeeded();
      }
    }
  }, [isOpen, currentUser?.username, preloadUserAvatars]);

  // 创建测试数据（仅开发模式）
  const createTestDataIfNeeded = async () => {
    if (!currentUser) return;

    try {
      // 检查是否已有对话
      const response = await fetch('/api/chat/conversations');
      if (response.ok) {
        const existingConversations = await response.json();
        if (existingConversations.length === 0) {
          // 创建一个测试对话
          const testConversation = {
            name: '测试对话',
            participants: [currentUser.username, 'test-user'],
            type: 'private',
            created_at: Date.now(),
            updated_at: Date.now(),
          };

          const createResponse = await fetch('/api/chat/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testConversation),
          });

          if (createResponse.ok) {
            loadConversations(); // 重新加载对话列表
          }
        }
      }
    } catch (error) {
      console.error('创建测试数据失败:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 点击外部关闭表情选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showEmojiPicker && !target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // 计算总的未读聊天消息数量
  useEffect(() => {
    const totalChatCount = Object.values(conversationUnreadCounts).reduce((sum, count) => sum + count, 0);
    setUnreadChatCount(totalChatCount);
  }, [conversationUnreadCounts]);

  // 通知父组件消息数量变化
  useEffect(() => {
    const totalCount = unreadChatCount + unreadFriendRequestCount;
    onMessageCountChange?.(totalCount);
  }, [unreadChatCount, unreadFriendRequestCount, onMessageCountChange]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 生成头像URL（优先使用真实头像，回退到默认头像）
  const getAvatarUrl = (username: string) => {
    const realAvatar = userAvatars[username];
    if (realAvatar) {
      return realAvatar; // 返回Base64格式的真实头像
    }
    // 使用Dicebear API生成默认头像
    return `https://api.dicebear.com/7.x/initials/svg?seed=${username}&backgroundColor=3B82F6,8B5CF6,EC4899,10B981,F59E0B&textColor=ffffff`;
  };

  // 获取用户显示名称
  const getDisplayName = (username: string) => {
    if (username === currentUser?.username) return '我';
    const friend = friends.find(f => f.username === username);
    return friend?.nickname || username;
  };

  // 格式化消息时间显示
  const formatMessageTime = (timestamp: number) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

    const timeStr = messageDate.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    if (messageDay.getTime() === today.getTime()) {
      // 今天的消息：只显示时分秒
      return timeStr;
    } else if (messageDay.getTime() === yesterday.getTime()) {
      // 昨天的消息：昨天-时分秒
      return `昨天-${timeStr}`;
    } else {
      // 更早的消息：年月日-时分秒
      const dateStr = messageDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return `${dateStr}-${timeStr}`;
    }
  };

  // 处理表情选择
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // 处理图片上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      showError('文件类型错误', '请选择图片文件');
      return;
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('文件过大', '图片大小不能超过5MB');
      return;
    }

    setUploadingImage(true);

    try {
      // 转换为base64
      const base64 = await fileToBase64(file);

      // 发送图片消息
      if (selectedConversation && currentUser) {
        const message: Omit<ChatMessage, 'id'> = {
          conversation_id: selectedConversation.id,
          sender_id: currentUser.username || '',
          sender_name: currentUser.username || '',
          content: base64,
          message_type: 'image',
          timestamp: Date.now(),
          is_read: false,
        };

        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        });

        if (response.ok) {
          const sentMessage = await response.json();
          await loadMessages(selectedConversation.id);
          await loadConversations();

          // 通过WebSocket通知其他参与者
          if (isConnected) {
            sendWebSocketMessage({
              type: 'message',
              data: {
                ...sentMessage,
                conversation_id: selectedConversation.id,
                participants: selectedConversation.participants,
              },
              timestamp: Date.now(),
            });
          }
        } else {
          showError('发送失败', '图片发送失败，请重试');
        }
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      showError('发送失败', '图片处理失败，请重试');
    } finally {
      setUploadingImage(false);
      // 清除文件选择
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 文件转base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);

        // 预加载所有对话参与者的头像
        const allParticipants = data.reduce((acc: string[], conv: Conversation) => {
          return [...acc, ...conv.participants];
        }, []);
        const uniqueParticipants = Array.from(new Set<string>(allParticipants));
        preloadUserAvatars(uniqueParticipants);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await fetch('/api/chat/friends');
      if (response.ok) {
        const data = await response.json();
        setFriends(data);

        // 预加载所有好友的头像
        const friendUsernames = data.map((friend: Friend) => friend.username);
        preloadUserAvatars(friendUsernames);
      }
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const response = await fetch('/api/chat/friend-requests');
      if (response.ok) {
        const data = await response.json();
        setFriendRequests(data);

        // 预加载好友请求发送者的头像
        const requestSenders = data.map((request: FriendRequest) => request.from_user);
        const uniqueSenders = Array.from(new Set<string>(requestSenders));
        preloadUserAvatars(uniqueSenders);
      }
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);

        // 预加载所有发送者的头像
        const senderIds = Array.from(new Set<string>(data.map((msg: ChatMessage) => msg.sender_id)));
        preloadUserAvatars(senderIds);
      } else {
        // 处理非200状态码
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to load messages - Status:', response.status, 'Error:', errorData);

        if (response.status === 401) {
          showError('未授权', '请重新登录');
        } else if (response.status === 403) {
          showError('无权限', '您没有权限访问此对话');
        } else if (response.status === 404) {
          showError('对话不存在', '该对话可能已被删除');
        } else {
          showError('加载消息失败', errorData.error || '服务器错误');
        }

        // 清空消息列表
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      showError('加载消息失败', '网络错误，请稍后重试');
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    const message: Omit<ChatMessage, 'id'> = {
      conversation_id: selectedConversation.id,
      sender_id: currentUser.username || '',
      sender_name: currentUser.username || '',
      content: newMessage.trim(),
      message_type: 'text',
      timestamp: Date.now(),
      is_read: false,
    };

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setNewMessage('');
        await loadMessages(selectedConversation.id);
        await loadConversations();

        // 通过WebSocket通知其他参与者
        if (isConnected) {
          sendWebSocketMessage({
            type: 'message',
            data: {
              ...sentMessage,
              conversation_id: selectedConversation.id,
              participants: selectedConversation.participants,
            },
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const searchUsers = async () => {
    if (!friendSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/chat/search-users?q=${encodeURIComponent(friendSearchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);

        // 预加载搜索结果用户的头像
        const searchUsernames = data.map((user: Friend) => user.username);
        preloadUserAvatars(searchUsernames);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const sendFriendRequest = async (toUser: string) => {
    if (!currentUser) return;

    const request: Omit<FriendRequest, 'id'> = {
      from_user: currentUser.username || '',
      to_user: toUser,
      message: '请求添加您为好友',
      status: 'pending',
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    try {
      const response = await fetch('/api/chat/friend-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        const sentRequest = await response.json();
        showSuccess('好友申请已发送', '等待对方确认');

        // 清空搜索结果和搜索框
        setFriendSearchQuery('');
        setSearchResults([]);

        // 通过WebSocket通知目标用户
        if (isConnected) {
          sendWebSocketMessage({
            type: 'friend_request',
            data: sentRequest,
            timestamp: Date.now(),
          });
        }
      } else {
        showError('发送失败', '请稍后重试');
      }
    } catch (error) {
      console.error('Failed to send friend request:', error);
      showError('发送失败', '网络错误，请稍后重试');
    }
  };

  const handleFriendRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      const response = await fetch('/api/chat/friend-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status }),
      });

      if (response.ok) {
        await loadFriendRequests();
        if (status === 'accepted') {
          await loadFriends();
        }
        // 处理好友申请后，减少好友请求计数
        onFriendRequestCountReset?.(1);
      }
    } catch (error) {
      console.error('Failed to handle friend request:', error);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isFriend = (username: string) => {
    return friends.some(friend => friend.username === username);
  };

  const isUserOnline = (username: string) => {
    return onlineUsers.includes(username);
  };

  // 创建或获取与好友的对话
  const startConversationWithFriend = async (friendUsername: string) => {
    try {
      // 尝试查找现有对话
      const existingConv = conversations.find(conv =>
        conv.participants.includes(friendUsername) &&
        conv.participants.includes(currentUser?.username || '')
      );

      if (existingConv) {
        setSelectedConversation(existingConv);
        setActiveTab('chat');
        loadMessages(existingConv.id);
        return;
      }

      // 创建新对话
      const newConv = {
        name: friendUsername,
        participants: [currentUser?.username || '', friendUsername],
        type: 'private' as const,
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConv),
      });

      if (response.ok) {
        const createdConv = await response.json();
        setSelectedConversation(createdConv);
        setActiveTab('chat');
        await loadConversations();
        loadMessages(createdConv.id);
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      showError('创建对话失败', '请稍后重试');
    }
  };

  // 处理标签切换
  const handleTabChange = (tab: 'chat' | 'friends') => {
    setActiveTab(tab);

    // 清除相应的未读计数
    if (tab === 'friends') {
      const currentFriendRequestCount = unreadFriendRequestCount;
      setUnreadFriendRequestCount(0);
      // 通知父组件重置好友请求计数
      onFriendRequestCountReset?.(currentFriendRequestCount);
    }
  };

  // 处理对话选择
  const handleConversationSelect = (conv: Conversation) => {
    setSelectedConversation(conv);
    loadMessages(conv.id);

    // 清除该对话的未读消息计数
    const resetCount = conversationUnreadCounts[conv.id] || 0;
    if (resetCount > 0) {
      setConversationUnreadCounts(prev => ({
        ...prev,
        [conv.id]: 0
      }));
      // 通知父组件重置聊天计数
      onChatCountReset?.(resetCount);
    }
  };

  const pendingFriendRequests = friendRequests.filter(
    (req) => req.to_user === currentUser?.username && req.status === 'pending'
  );

  const renderAvatar = (
    username: string,
    displayName = getDisplayName(username),
    size: 'sm' | 'md' | 'lg' = 'md'
  ) => (
    <Avatar size={size}>
      <Avatar.Image src={getAvatarUrl(username)} alt={displayName} />
      <Avatar.Fallback>{displayName.charAt(0).toUpperCase()}</Avatar.Fallback>
    </Avatar>
  );

  const renderPresence = (username: string) => (
    <span
      className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${
        isUserOnline(username) ? 'bg-success' : 'bg-muted'
      }`}
    />
  );

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.participants.length === 2) {
      const otherUser = conv.participants.find(
        (participant) => participant !== currentUser?.username
      );

      return otherUser ? (
        <div className='relative'>
          {renderAvatar(otherUser, getDisplayName(otherUser), 'lg')}
          {renderPresence(otherUser)}
        </div>
      ) : null;
    }

    return (
      <Badge color='accent' size='sm'>
        <Badge.Anchor>
          <Avatar size='lg'>
            <Avatar.Fallback>
              <Users className='h-5 w-5' />
            </Avatar.Fallback>
          </Avatar>
        </Badge.Anchor>
        <Badge.Label>{conv.participants.length}</Badge.Label>
      </Badge>
    );
  };

  const selectedOtherUser =
    selectedConversation?.participants.length === 2
      ? selectedConversation.participants.find(
          (participant) => participant !== currentUser?.username
        )
      : null;

  if (!isOpen) return null;

  return (
    <AppDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title='聊天'
      description={isConnected ? '实时连接已建立' : '实时连接未建立'}
      size='cover'
      className='h-[min(86vh,52rem)]'
    >
      <div className='grid h-full min-h-[32rem] grid-cols-1 overflow-hidden md:grid-cols-[22rem_minmax(0,1fr)]'>
        <section
          className={`min-h-0 flex-col gap-4 pr-0 md:flex md:border-r md:border-border md:pr-4 ${
            isMobile && selectedConversation ? 'hidden' : 'flex'
          }`}
        >
          <AppTabs
            ariaLabel='聊天类型'
            selectedKey={activeTab}
            onSelectionChange={(key) => handleTabChange(key as 'chat' | 'friends')}
            items={[
              {
                key: 'chat',
                label: (
                  <span className='inline-flex items-center gap-2'>
                    <MessageCircle className='h-4 w-4' />
                    对话
                    {unreadChatCount > 0 && (
                      <Chip color='danger' size='sm'>
                        {unreadChatCount > 99 ? '99+' : unreadChatCount}
                      </Chip>
                    )}
                  </span>
                ),
              },
              {
                key: 'friends',
                label: (
                  <span className='inline-flex items-center gap-2'>
                    <Users className='h-4 w-4' />
                    好友
                    {unreadFriendRequestCount > 0 && (
                      <Chip color='danger' size='sm'>
                        {unreadFriendRequestCount > 99 ? '99+' : unreadFriendRequestCount}
                      </Chip>
                    )}
                  </span>
                ),
              },
            ]}
          />

          <TextField>
            <Label className='sr-only'>
              {activeTab === 'chat' ? '搜索对话' : '搜索用户'}
            </Label>
            <Input
              type='search'
              placeholder={activeTab === 'chat' ? '搜索对话...' : '搜索用户...'}
              value={activeTab === 'chat' ? searchQuery : friendSearchQuery}
              onChange={(event) =>
                activeTab === 'chat'
                  ? setSearchQuery(event.target.value)
                  : setFriendSearchQuery(event.target.value)
              }
            />
          </TextField>

          {activeTab === 'friends' && searchResults.length > 0 ? (
            <Card variant='secondary' className='p-3'>
              <p className='mb-2 text-xs font-medium text-muted'>搜索结果</p>
              <div className='space-y-2'>
                {searchResults.map((user) => (
                  <div key={user.id} className='flex items-center gap-3'>
                    {renderAvatar(user.username, user.nickname || user.username, 'sm')}
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-medium'>
                        {user.nickname || user.username}
                      </p>
                      <p className='text-xs text-muted'>
                        {isFriend(user.username) ? '已是好友' : '陌生人'}
                      </p>
                    </div>
                    {!isFriend(user.username) && (
                      <Button
                        isIconOnly
                        size='sm'
                        variant='primary'
                        aria-label='发送好友申请'
                        onPress={() => sendFriendRequest(user.username)}
                      >
                        <UserPlus className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          <ScrollShadow hideScrollBar className='min-h-0 flex-1'>
            {activeTab === 'chat' ? (
              <div className='space-y-2'>
                {filteredConversations.map((conv) => (
                  <Button
                    key={conv.id}
                    fullWidth
                    variant={selectedConversation?.id === conv.id ? 'secondary' : 'tertiary'}
                    className='h-auto justify-start p-3'
                    onPress={() => handleConversationSelect(conv)}
                  >
                    <span className='flex w-full items-center gap-3 text-left'>
                      {getConversationAvatar(conv)}
                      <span className='min-w-0 flex-1'>
                        <span className='mb-1 flex items-center justify-between gap-2'>
                          <span className='truncate font-medium'>{conv.name}</span>
                          {conv.last_message?.timestamp ? (
                            <span className='shrink-0 text-xs text-muted'>
                              {new Date(conv.last_message.timestamp).toLocaleTimeString('zh-CN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          ) : null}
                        </span>
                        <span className='flex items-center justify-between gap-2'>
                          <span className='truncate text-sm text-muted'>
                            {conv.last_message?.message_type === 'image'
                              ? '[图片]'
                              : conv.last_message?.content || '暂无消息'}
                          </span>
                          {conversationUnreadCounts[conv.id] > 0 ? (
                            <Chip color='danger' size='sm'>
                              {conversationUnreadCounts[conv.id] > 99
                                ? '99+'
                                : conversationUnreadCounts[conv.id]}
                            </Chip>
                          ) : null}
                        </span>
                      </span>
                    </span>
                  </Button>
                ))}
              </div>
            ) : (
              <div className='space-y-4'>
                {pendingFriendRequests.length > 0 ? (
                  <section className='space-y-2'>
                    <p className='text-sm font-medium'>好友申请</p>
                    {pendingFriendRequests.map((request) => (
                      <Card key={request.id} variant='secondary' className='p-3'>
                        <div className='flex items-center gap-3'>
                          {renderAvatar(request.from_user, request.from_user, 'md')}
                          <div className='min-w-0 flex-1'>
                            <p className='truncate text-sm font-medium'>
                              {request.from_user}
                            </p>
                            <p className='text-xs text-muted'>
                              {new Date(request.created_at).toLocaleString('zh-CN', {
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <p className='mt-3 text-xs text-muted'>{request.message}</p>
                        <div className='mt-3 flex gap-2'>
                          <Button
                            size='sm'
                            variant='primary'
                            onPress={() => handleFriendRequest(request.id, 'accepted')}
                          >
                            接受
                          </Button>
                          <Button
                            size='sm'
                            variant='secondary'
                            onPress={() => handleFriendRequest(request.id, 'rejected')}
                          >
                            拒绝
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </section>
                ) : null}

                <section className='space-y-2'>
                  <p className='text-sm font-medium'>我的好友</p>
                  {friends.map((friend) => (
                    <Button
                      key={friend.id}
                      fullWidth
                      variant='tertiary'
                      className='h-auto justify-start p-3'
                      onPress={() => startConversationWithFriend(friend.username)}
                    >
                      <span className='flex w-full items-center gap-3 text-left'>
                        <span className='relative'>
                          {renderAvatar(friend.username, friend.nickname || friend.username, 'md')}
                          {renderPresence(friend.username)}
                        </span>
                        <span className='min-w-0 flex-1'>
                          <span className='block truncate font-medium'>
                            {friend.nickname || friend.username}
                          </span>
                          <span className='block text-xs text-muted'>
                            {isUserOnline(friend.username) ? '在线' : '离线'}
                          </span>
                        </span>
                      </span>
                    </Button>
                  ))}
                </section>
              </div>
            )}
          </ScrollShadow>
        </section>

        <section
          className={`min-h-0 flex-col md:flex md:pl-4 ${
            isMobile && !selectedConversation ? 'hidden' : 'flex'
          }`}
        >
          {selectedConversation ? (
            <>
              <div className='flex items-center gap-3 pb-3'>
                {isMobile ? (
                  <Button
                    isIconOnly
                    variant='tertiary'
                    aria-label='返回对话列表'
                    onPress={() => setSelectedConversation(null)}
                  >
                    <span aria-hidden>‹</span>
                  </Button>
                ) : null}
                {selectedOtherUser ? (
                  <span className='relative'>
                    {renderAvatar(selectedOtherUser, getDisplayName(selectedOtherUser), 'lg')}
                    {renderPresence(selectedOtherUser)}
                  </span>
                ) : (
                  <Avatar size='lg'>
                    <Avatar.Fallback>
                      <Users className='h-5 w-5' />
                    </Avatar.Fallback>
                  </Avatar>
                )}
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>
                    {selectedConversation.name}
                  </p>
                  <p className='text-xs text-muted'>
                    {selectedOtherUser
                      ? `${isUserOnline(selectedOtherUser) ? '在线' : '离线'} · ${selectedConversation.participants.length} 人`
                      : `${selectedConversation.participants.length} 人`}
                  </p>
                </div>
              </div>

              <ScrollShadow hideScrollBar className='min-h-0 flex-1 py-2'>
                <div className='space-y-4'>
                  {messages.map((message, index) => {
                    const isOwnMessage = message.sender_id === currentUser?.username;
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const showName =
                      !isOwnMessage &&
                      (!prevMessage || prevMessage.sender_id !== message.sender_id);

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`flex max-w-[min(36rem,86%)] items-end gap-3 ${
                            isOwnMessage ? 'flex-row-reverse' : ''
                          }`}
                        >
                          {renderAvatar(message.sender_id, getDisplayName(message.sender_id), 'sm')}
                          <div className='min-w-0'>
                            {showName ? (
                              <p className='mb-1 text-xs font-medium text-muted'>
                                {getDisplayName(message.sender_id)}
                              </p>
                            ) : null}
                            <Card
                              variant={isOwnMessage ? 'secondary' : 'default'}
                              className='p-3'
                            >
                              {message.message_type === 'image' ? (
                                <img
                                  src={message.content}
                                  alt='图片消息'
                                  className='max-h-[300px] max-w-full cursor-pointer object-contain'
                                  onClick={() => {
                                    const newWindow = window.open('');
                                    if (newWindow) {
                                      newWindow.document.write(`
                                        <html>
                                          <head>
                                            <title>图片查看</title>
                                            <style>
                                              body { margin:0; padding:20px; background:#000; display:flex; align-items:center; justify-content:center; }
                                              img { max-width:100%; max-height:100vh; object-fit:contain; border-radius:8px; box-shadow:0 20px 25px -5px rgb(0 0 0 / 0.4); }
                                            </style>
                                          </head>
                                          <body>
                                            <img src="${message.content}" />
                                          </body>
                                        </html>
                                      `);
                                    }
                                  }}
                                />
                              ) : (
                                <p className='whitespace-pre-wrap break-words text-sm leading-relaxed'>
                                  {message.content}
                                </p>
                              )}
                            </Card>
                            <p
                              className={`mt-1 text-xs text-muted ${
                                isOwnMessage ? 'text-right' : 'text-left'
                              }`}
                            >
                              {formatMessageTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollShadow>

              <div className='relative pt-3'>
                {showEmojiPicker ? (
                  <Card
                    variant='default'
                    className='emoji-picker-container absolute bottom-full left-0 right-0 z-50 mb-2 p-3'
                  >
                    <div className='mb-3 flex items-center justify-between'>
                      <p className='text-sm font-medium'>选择表情</p>
                      <Button
                        isIconOnly
                        size='sm'
                        variant='tertiary'
                        aria-label='关闭表情'
                        onPress={() => setShowEmojiPicker(false)}
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                    <div className='grid max-h-40 grid-cols-9 gap-1 overflow-y-auto'>
                      {emojis.map((emoji, index) => (
                        <Button
                          key={`${emoji}-${index}`}
                          isIconOnly
                          variant='tertiary'
                          aria-label={`选择表情 ${emoji}`}
                          onPress={() => handleEmojiSelect(emoji)}
                        >
                          <span className='text-xl'>{emoji}</span>
                        </Button>
                      ))}
                    </div>
                  </Card>
                ) : null}

                <Card variant='secondary' className='p-3'>
                  <div className='mb-2 flex items-center justify-between gap-2'>
                    <div className='flex items-center gap-1'>
                      <Button
                        isIconOnly
                        variant={showEmojiPicker ? 'secondary' : 'tertiary'}
                        aria-label='表情'
                        className='emoji-picker-container'
                        onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                      >
                        <Smile className='h-5 w-5' />
                      </Button>
                      <Button
                        isIconOnly
                        variant='tertiary'
                        aria-label='上传图片'
                        isDisabled={uploadingImage}
                        onPress={() => fileInputRef.current?.click()}
                      >
                        {uploadingImage ? <Spinner size='sm' /> : <ImageIcon className='h-5 w-5' />}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type='file'
                        accept='image/*'
                        className='hidden'
                        onChange={handleImageUpload}
                      />
                      <Button
                        isIconOnly
                        variant='tertiary'
                        aria-label='附件即将开放'
                        isDisabled
                      >
                        <Paperclip className='h-5 w-5' />
                      </Button>
                    </div>
                    <div className='flex items-center gap-2 text-xs text-muted'>
                      {newMessage.length > 0 ? (
                        <span className={newMessage.length > 500 ? 'text-danger' : ''}>
                          {newMessage.length}/1000
                        </span>
                      ) : null}
                      <Chip color={isConnected ? 'success' : 'danger'} size='sm'>
                        {isConnected ? '在线' : '离线'}
                      </Chip>
                    </div>
                  </div>

                  <div className='relative'>
                    <TextArea
                      value={newMessage}
                      onChange={(event) => setNewMessage(event.target.value)}
                      placeholder='输入消息内容... 按Enter发送，Shift+Enter换行'
                      className='max-h-28 min-h-12 w-full pr-14'
                      rows={1}
                      maxLength={1000}
                      onInput={(event) => {
                        const target = event.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      isIconOnly
                      variant='primary'
                      aria-label={!newMessage.trim() ? '请输入消息内容' : '发送消息'}
                      className='absolute bottom-1.5 right-1.5'
                      isDisabled={!newMessage.trim() || uploadingImage}
                      onPress={handleSendMessage}
                    >
                      <Send className='h-4 w-4' />
                    </Button>
                  </div>
                  <div className='mt-2 flex items-center justify-between text-xs text-muted'>
                    <span>支持文字、表情、5MB 内图片</span>
                    <span>{uploadingImage ? '上传中...' : 'Enter发送'}</span>
                  </div>
                </Card>
              </div>
            </>
          ) : (
            <div className='flex h-full items-center justify-center text-muted'>
              选择一个对话开始聊天
            </div>
          )}
        </section>
      </div>
    </AppDialog>
  );
}
