/* eslint-disable no-console,@typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

'use client';

import {
  Dropdown,
  Label,
} from '@heroui/react';
import {
  Camera,
  Check,
  ChevronDown,
  ExternalLink,
  KeyRound,
  LogOut,
  Settings,
  Shield,
  User,
  X,
  Upload,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactCrop, { Crop, PercentCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { getAuthInfoFromBrowserCookie } from '@/lib/auth';
import { CURRENT_VERSION } from '@/lib/version';
import { checkForUpdates, UpdateStatus } from '@/lib/version_check';

import { VersionPanel } from './VersionPanel';
import { useToast } from './Toast';
import { AppIconButton } from './ui/HeroPrimitives';

interface AuthInfo {
  username?: string;
  role?: 'owner' | 'admin' | 'user';
  avatar?: string;
}

export const UserMenu: React.FC = () => {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false);
  const [isChangeAvatarOpen, setIsChangeAvatarOpen] = useState(false);
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [storageType, setStorageType] = useState<string>('localstorage');
  const [mounted, setMounted] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 裁剪相关状态
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 80,
    height: 80,
    x: 10,
    y: 10,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imageRef = useRef<HTMLImageElement>(null);
  const [showCropper, setShowCropper] = useState(false);

  // Body 滚动锁定 - 使用 overflow 方式避免布局问题
  useEffect(() => {
    if (isSettingsOpen || isChangePasswordOpen || isChangeAvatarOpen) {
      const body = document.body;
      const html = document.documentElement;

      // 保存原始样式
      const originalBodyOverflow = body.style.overflow;
      const originalHtmlOverflow = html.style.overflow;

      // 只设置 overflow 来阻止滚动
      body.style.overflow = 'hidden';
      html.style.overflow = 'hidden';

      return () => {

        // 恢复所有原始样式
        body.style.overflow = originalBodyOverflow;
        html.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isSettingsOpen, isChangePasswordOpen]);

  // 设置相关状态
  const [defaultAggregateSearch, setDefaultAggregateSearch] = useState(true);
  const [doubanProxyUrl, setDoubanProxyUrl] = useState('');
  const [enableOptimization, setEnableOptimization] = useState(true);
  const [fluidSearch, setFluidSearch] = useState(true);
  const [liveDirectConnect, setLiveDirectConnect] = useState(false);
  const [doubanDataSource, setDoubanDataSource] = useState('cmliussss-cdn-tencent');
  const [doubanImageProxyType, setDoubanImageProxyType] = useState('cmliussss-cdn-tencent');
  const [doubanImageProxyUrl, setDoubanImageProxyUrl] = useState('');
  const [isDoubanDropdownOpen, setIsDoubanDropdownOpen] = useState(false);
  const [isDoubanImageProxyDropdownOpen, setIsDoubanImageProxyDropdownOpen] =
    useState(false);

  // 豆瓣数据源选项
  const doubanDataSourceOptions = [
    { value: 'direct', label: '直连（服务器直接请求豆瓣）' },
    { value: 'cors-proxy-zwei', label: 'Cors Proxy By Zwei' },
    {
      value: 'cmliussss-cdn-tencent',
      label: '豆瓣 CDN By CMLiussss（腾讯云）',
    },
    { value: 'cmliussss-cdn-ali', label: '豆瓣 CDN By CMLiussss（阿里云）' },
    { value: 'custom', label: '自定义代理' },
  ];

  // 豆瓣图片代理选项
  const doubanImageProxyTypeOptions = [
    { value: 'direct', label: '直连（浏览器直接请求豆瓣）' },
    { value: 'server', label: '服务器代理（由服务器代理请求豆瓣）' },
    { value: 'img3', label: '豆瓣官方精品 CDN（阿里云）' },
    {
      value: 'cmliussss-cdn-tencent',
      label: '豆瓣 CDN By CMLiussss（腾讯云）',
    },
    { value: 'cmliussss-cdn-ali', label: '豆瓣 CDN By CMLiussss（阿里云）' },
    { value: 'custom', label: '自定义代理' },
  ];

  // 修改密码相关状态
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // 版本检查相关状态
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // 确保组件已挂载
  useEffect(() => {
    setMounted(true);

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 获取认证信息、存储类型和头像
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = getAuthInfoFromBrowserCookie();
      setAuthInfo(auth);

      // 从API获取头像
      if (auth?.username) {
        fetchUserAvatar(auth.username);
      }

      const type =
        (window as any).RUNTIME_CONFIG?.STORAGE_TYPE || 'localstorage';
      setStorageType(type);
    }
  }, []);

  // 从 localStorage 读取设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAggregateSearch = localStorage.getItem(
        'defaultAggregateSearch'
      );
      if (savedAggregateSearch !== null) {
        setDefaultAggregateSearch(JSON.parse(savedAggregateSearch));
      }

      const savedDoubanDataSource = localStorage.getItem('doubanDataSource');
      const defaultDoubanProxyType =
        (window as any).RUNTIME_CONFIG?.DOUBAN_PROXY_TYPE || 'cmliussss-cdn-tencent';
      if (savedDoubanDataSource !== null) {
        setDoubanDataSource(savedDoubanDataSource);
      } else if (defaultDoubanProxyType) {
        setDoubanDataSource(defaultDoubanProxyType);
      }

      const savedDoubanProxyUrl = localStorage.getItem('doubanProxyUrl');
      const defaultDoubanProxy =
        (window as any).RUNTIME_CONFIG?.DOUBAN_PROXY || '';
      if (savedDoubanProxyUrl !== null) {
        setDoubanProxyUrl(savedDoubanProxyUrl);
      } else if (defaultDoubanProxy) {
        setDoubanProxyUrl(defaultDoubanProxy);
      }

      const savedDoubanImageProxyType = localStorage.getItem(
        'doubanImageProxyType'
      );
      const defaultDoubanImageProxyType =
        (window as any).RUNTIME_CONFIG?.DOUBAN_IMAGE_PROXY_TYPE || 'cmliussss-cdn-tencent';
      if (savedDoubanImageProxyType !== null) {
        setDoubanImageProxyType(savedDoubanImageProxyType);
      } else if (defaultDoubanImageProxyType) {
        setDoubanImageProxyType(defaultDoubanImageProxyType);
      }

      const savedDoubanImageProxyUrl = localStorage.getItem(
        'doubanImageProxyUrl'
      );
      const defaultDoubanImageProxyUrl =
        (window as any).RUNTIME_CONFIG?.DOUBAN_IMAGE_PROXY || '';
      if (savedDoubanImageProxyUrl !== null) {
        setDoubanImageProxyUrl(savedDoubanImageProxyUrl);
      } else if (defaultDoubanImageProxyUrl) {
        setDoubanImageProxyUrl(defaultDoubanImageProxyUrl);
      }

      const savedEnableOptimization =
        localStorage.getItem('enableOptimization');
      if (savedEnableOptimization !== null) {
        setEnableOptimization(JSON.parse(savedEnableOptimization));
      }

      const savedFluidSearch = localStorage.getItem('fluidSearch');
      const defaultFluidSearch =
        (window as any).RUNTIME_CONFIG?.FLUID_SEARCH !== false;
      if (savedFluidSearch !== null) {
        setFluidSearch(JSON.parse(savedFluidSearch));
      } else if (defaultFluidSearch !== undefined) {
        setFluidSearch(defaultFluidSearch);
      }

      const savedLiveDirectConnect = localStorage.getItem('liveDirectConnect');
      if (savedLiveDirectConnect !== null) {
        setLiveDirectConnect(JSON.parse(savedLiveDirectConnect));
      }
    }
  }, []);

  // 版本检查
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const status = await checkForUpdates();
        setUpdateStatus(status);
      } catch (error) {
        console.warn('版本检查失败:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkUpdate();
  }, []);

  // 点击外部区域关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDoubanDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('[data-dropdown="douban-datasource"]')) {
          setIsDoubanDropdownOpen(false);
        }
      }
    };

    if (isDoubanDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDoubanDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDoubanImageProxyDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('[data-dropdown="douban-image-proxy"]')) {
          setIsDoubanImageProxyDropdownOpen(false);
        }
      }
    };

    if (isDoubanImageProxyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDoubanImageProxyDropdownOpen]);

  const handleMenuClick = () => {
    setIsOpen(!isOpen);
  };

  const handleCloseMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('注销请求失败:', error);
    }
    window.location.href = '/';
  };

  const handleAdminPanel = () => {
    router.push('/admin');
  };

  const handleChangePassword = () => {
    setIsOpen(false);
    setIsChangePasswordOpen(true);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const handleCloseChangePassword = () => {
    setIsChangePasswordOpen(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  // 头像相关处理函数
  const fetchUserAvatar = async (username: string) => {
    try {
      const response = await fetch(`/api/avatar?user=${encodeURIComponent(username)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.avatar) {
          setAvatarUrl(data.avatar);
        }
      }
    } catch (error) {
      console.error('获取头像失败:', error);
    }
  };

  const handleChangeAvatar = () => {
    setIsOpen(false);
    setIsChangeAvatarOpen(true);
    setSelectedImage('');
    setShowCropper(false);
  };

  const handleCloseChangeAvatar = () => {
    setIsChangeAvatarOpen(false);
    setSelectedImage('');
    setShowCropper(false);
  };

  const handleOpenFileSelector = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件是图片且小于 2MB
    if (!file.type.startsWith('image/')) {
      showError('请选择图片文件', '仅支持 JPG、PNG、GIF 等图片格式');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showError('图片大小不能超过 2MB', '请选择较小的图片文件');
      return;
    }

    // 将图片转换为 base64 格式用于裁剪
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedImage(event.target.result.toString());
        setShowCropper(true);
      }
    };
    reader.readAsDataURL(file);
  };

  // 生成裁剪后的图片
  const getCroppedImage = async (
    image: HTMLImageElement,
    crop: PixelCrop
  ): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // 获取图片的自然尺寸和显示尺寸的比例
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // 计算裁剪区域在原始图片上的实际坐标和尺寸
    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;

    // 设置最终输出尺寸（统一为200x200的头像）
    const outputSize = 200;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // 设置高质量渲染
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 绘制裁剪后的图片，缩放到统一尺寸
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        }
      }, 'image/jpeg', 0.9);
    });
  };

  // 确认裁剪并上传
  // 图片加载完成时重置裁剪区域
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;

    // 计算一个居中的正方形裁剪区域
    const minDimension = Math.min(width, height);
    const cropSize = minDimension * 0.8; // 使用80%的最小维度
    const cropX = (width - cropSize) / 2;
    const cropY = (height - cropSize) / 2;

    const newCrop = {
      unit: 'px' as const,
      x: cropX,
      y: cropY,
      width: cropSize,
      height: cropSize,
    };

    setCrop(newCrop);
  };

  const handleConfirmCrop = async () => {
    if (!completedCrop || !imageRef.current || !authInfo?.username) return;

    try {
      setIsUploadingAvatar(true);

      const croppedImageBase64 = await getCroppedImage(imageRef.current, completedCrop);

      // 上传到服务器
      const response = await fetch('/api/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar: croppedImageBase64,
          targetUser: authInfo.username,
        }),
      });

      if (response.ok) {
        setAvatarUrl(croppedImageBase64);
        showSuccess('头像上传成功', '您的头像已更新');
        handleCloseChangeAvatar();
      } else {
        const errorData = await response.json();
        showError('头像上传失败', errorData.error || '请稍后重试');
      }
    } catch (error) {
      console.error('上传头像失败:', error);
      showError('头像上传失败', '网络错误，请稍后重试');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmitChangePassword = async () => {
    setPasswordError('');

    // 验证密码
    if (!newPassword) {
      setPasswordError('新密码不得为空');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的密码不一致');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || '修改密码失败');
        return;
      }

      // 修改成功，关闭弹窗并登出
      setIsChangePasswordOpen(false);
      await handleLogout();
    } catch (error) {
      setPasswordError('网络错误，请稍后重试');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSettings = () => {
    setIsOpen(false);
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  // 设置相关的处理函数
  const handleAggregateToggle = (value: boolean) => {
    setDefaultAggregateSearch(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('defaultAggregateSearch', JSON.stringify(value));
    }
  };

  const handleDoubanProxyUrlChange = (value: string) => {
    setDoubanProxyUrl(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doubanProxyUrl', value);
    }
  };

  const handleOptimizationToggle = (value: boolean) => {
    setEnableOptimization(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('enableOptimization', JSON.stringify(value));
    }
  };

  const handleFluidSearchToggle = (value: boolean) => {
    setFluidSearch(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fluidSearch', JSON.stringify(value));
    }
  };

  const handleLiveDirectConnectToggle = (value: boolean) => {
    setLiveDirectConnect(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('liveDirectConnect', JSON.stringify(value));
    }
  };

  const handleDoubanDataSourceChange = (value: string) => {
    setDoubanDataSource(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doubanDataSource', value);
    }
  };

  const handleDoubanImageProxyTypeChange = (value: string) => {
    setDoubanImageProxyType(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doubanImageProxyType', value);
    }
  };

  const handleDoubanImageProxyUrlChange = (value: string) => {
    setDoubanImageProxyUrl(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doubanImageProxyUrl', value);
    }
  };

  // 获取感谢信息
  const getThanksInfo = (dataSource: string) => {
    switch (dataSource) {
      case 'cors-proxy-zwei':
        return {
          text: 'Thanks to @Zwei',
          url: 'https://github.com/bestzwei',
        };
      case 'cmliussss-cdn-tencent':
      case 'cmliussss-cdn-ali':
        return {
          text: 'Thanks to @CMLiussss',
          url: 'https://github.com/cmliu',
        };
      default:
        return null;
    }
  };

  const handleResetSettings = () => {
    const defaultDoubanProxyType =
      (window as any).RUNTIME_CONFIG?.DOUBAN_PROXY_TYPE || 'cmliussss-cdn-tencent';
    const defaultDoubanProxy =
      (window as any).RUNTIME_CONFIG?.DOUBAN_PROXY || '';
    const defaultDoubanImageProxyType =
      (window as any).RUNTIME_CONFIG?.DOUBAN_IMAGE_PROXY_TYPE || 'cmliussss-cdn-tencent';
    const defaultDoubanImageProxyUrl =
      (window as any).RUNTIME_CONFIG?.DOUBAN_IMAGE_PROXY || '';
    const defaultFluidSearch =
      (window as any).RUNTIME_CONFIG?.FLUID_SEARCH !== false;

    setDefaultAggregateSearch(true);
    setEnableOptimization(true);
    setFluidSearch(defaultFluidSearch);
    setLiveDirectConnect(false);
    setDoubanProxyUrl(defaultDoubanProxy);
    setDoubanDataSource(defaultDoubanProxyType);
    setDoubanImageProxyType(defaultDoubanImageProxyType);
    setDoubanImageProxyUrl(defaultDoubanImageProxyUrl);

    if (typeof window !== 'undefined') {
      localStorage.setItem('defaultAggregateSearch', JSON.stringify(true));
      localStorage.setItem('enableOptimization', JSON.stringify(true));
      localStorage.setItem('fluidSearch', JSON.stringify(defaultFluidSearch));
      localStorage.setItem('liveDirectConnect', JSON.stringify(false));
      localStorage.setItem('doubanProxyUrl', defaultDoubanProxy);
      localStorage.setItem('doubanDataSource', defaultDoubanProxyType);
      localStorage.setItem('doubanImageProxyType', defaultDoubanImageProxyType);
      localStorage.setItem('doubanImageProxyUrl', defaultDoubanImageProxyUrl);
    }
  };

  // 检查是否显示管理面板按钮
  const showAdminPanel =
    authInfo?.role === 'owner' || authInfo?.role === 'admin';

  // 检查是否显示修改密码按钮
  const showChangePassword =
    authInfo?.role !== 'owner' && storageType !== 'localstorage';

  // 角色中文映射
  const getRoleText = (role?: string) => {
    switch (role) {
      case 'owner':
        return '站长';
      case 'admin':
        return '管理员';
      case 'user':
        return '用户';
      default:
        return '';
    }
  };

  // 菜单面板内容
  const menuPanel = (
    <>
      {/* 背景遮罩 - 普通菜单无需模糊 */}
      <div
        className='fixed inset-0 bg-transparent z-[1000]'
        onClick={handleCloseMenu}
      />

      {/* 菜单面板 */}
      <div className='fixed right-4 top-14 z-[1001] w-56 overflow-hidden border border-border/70 bg-surface/95 shadow-[0_20px_45px_-30px_rgba(0,0,0,0.7)] select-none'>
        {/* 用户信息区域 */}
        <div className='border-b border-border/70 px-3 py-2.5'>
          <div className='flex items-center gap-3'>
            {/* 用户头像 */}
            <div className='relative h-10 w-10 flex-shrink-0 overflow-hidden border border-border/70'>
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="用户头像"
                  fill
                  sizes="40px"
                  className='object-cover'
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center bg-surface-secondary/60'>
                  <User className='h-6 w-6 text-accent' />
                </div>
              )}
            </div>
            {/* 用户信息 */}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center justify-between'>
                <span className='text-xs font-medium uppercase tracking-[0.16em] text-muted'>
                  当前用户
                </span>
                <span
                  className={`inline-flex items-center border border-border/70 px-1.5 py-0.5 text-xs font-medium ${(authInfo?.role || 'user') === 'owner'
                    ? 'text-accent'
                    : (authInfo?.role || 'user') === 'admin'
                      ? 'text-foreground'
                      : 'text-success'
                    }`}
                >
                  {getRoleText(authInfo?.role || 'user')}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='truncate text-sm font-semibold text-foreground'>
                  {authInfo?.username || 'default'}
                </div>
                <div className='text-[10px] uppercase tracking-[0.14em] text-muted'>
                  {storageType === 'localstorage' ? '本地' : storageType}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 菜单项 */}
        <div className='py-1'>
          {/* 设置按钮 */}
          <button
            onClick={handleSettings}
            className='theme-transition flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-muted hover:bg-background/20 hover:text-foreground'
          >
            <Settings className='h-4 w-4 text-muted' />
            <span className='font-medium'>设置</span>
          </button>

          {/* 管理面板按钮 */}
          {showAdminPanel && (
            <button
              onClick={handleAdminPanel}
              className='theme-transition flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-muted hover:bg-background/20 hover:text-foreground'
            >
              <Shield className='h-4 w-4 text-muted' />
              <span className='font-medium'>管理面板</span>
            </button>
          )}

          {/* 修改头像按钮 */}
          <button
            onClick={handleChangeAvatar}
            className='theme-transition flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-muted hover:bg-background/20 hover:text-foreground'
          >
            <Camera className='h-4 w-4 text-muted' />
            <span className='font-medium'>修改头像</span>
          </button>

          {/* 修改密码按钮 */}
          {showChangePassword && (
            <button
              onClick={handleChangePassword}
              className='theme-transition flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-muted hover:bg-background/20 hover:text-foreground'
            >
              <KeyRound className='h-4 w-4 text-muted' />
              <span className='font-medium'>修改密码</span>
            </button>
          )}

          {/* 分割线 */}
          <div className='my-1 border-t border-border/70'></div>

          {/* 登出按钮 */}
          <button
            onClick={handleLogout}
            className='theme-transition flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-danger hover:bg-danger/10'
          >
            <LogOut className='w-4 h-4' />
            <span className='font-medium'>登出</span>
          </button>

          {/* 分割线 */}
          <div className='my-1 border-t border-border/70'></div>

          {/* 版本信息 */}
          <button
            onClick={() => {
              setIsVersionPanelOpen(true);
              handleCloseMenu();
            }}
            className='theme-transition flex w-full items-center justify-center px-3 py-2 text-center text-xs text-muted hover:bg-background/20'
          >
            <div className='flex items-center gap-1'>
              <span className='font-mono'>v{CURRENT_VERSION}</span>
              {!isChecking &&
                updateStatus &&
                updateStatus !== UpdateStatus.FETCH_FAILED && (
                  <div
                    className={`w-2 h-2 rounded-full -translate-y-2 ${updateStatus === UpdateStatus.HAS_UPDATE
                      ? 'bg-warning'
                      : updateStatus === UpdateStatus.NO_UPDATE
                        ? 'bg-success'
                        : ''
                      }`}
                  ></div>
                )}
            </div>
          </button>
        </div>
      </div>
    </>
  );

  // 设置面板内容
  const settingsPanel = (
    <>
      {/* 背景遮罩 */}
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000]'
        onClick={handleCloseSettings}
        onTouchMove={(e) => {
          // 只阻止滚动，允许其他触摸事件
          e.preventDefault();
        }}
        onWheel={(e) => {
          // 阻止滚轮滚动
          e.preventDefault();
        }}
        style={{
          touchAction: 'none',
        }}
      />

      {/* 设置面板 */}
      <div
        className='a2-panel fixed left-1/2 top-1/2 z-[1001] flex max-h-[90vh] w-full max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col bg-surface/95'
      >
        {/* 内容容器 - 独立的滚动区域 */}
        <div
          className='flex-1 p-6 overflow-y-auto'
          data-panel-content
          style={{
            touchAction: 'pan-y', // 只允许垂直滚动
            overscrollBehavior: 'contain', // 防止滚动冒泡
          }}
        >
          {/* 标题栏 */}
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-3'>
              <h3 className='text-xl font-semibold tracking-[-0.045em] text-foreground'>
                本地设置
              </h3>
              <button
                onClick={handleResetSettings}
                className='a2-button a2-button-danger px-2 py-1 text-xs'
                title='重置为默认设置'
              >
                恢复默认
              </button>
            </div>
            <button
              onClick={handleCloseSettings}
              className='a2-icon-button h-8 w-8 p-1.5'
              aria-label='Close'
            >
              <X className='w-full h-full' />
            </button>
          </div>

          {/* 设置项 */}
          <div className='space-y-6'>
            {/* 豆瓣数据源选择 */}
            <div className='space-y-3'>
              <div>
                <h4 className='text-sm font-medium text-foreground'>
                  豆瓣数据代理
                </h4>
                <p className='mt-1 text-xs text-muted'>
                  选择获取豆瓣数据的方式
                </p>
              </div>
              <div className='relative' data-dropdown='douban-datasource'>
                {/* 自定义下拉选择框 */}
                <button
                  type='button'
                  onClick={() => setIsDoubanDropdownOpen(!isDoubanDropdownOpen)}
                  className='a2-field pr-10 text-left'
                >
                  {
                    doubanDataSourceOptions.find(
                      (option) => option.value === doubanDataSource
                    )?.label
                  }
                </button>

                {/* 下拉箭头 */}
                <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                  <ChevronDown
                    className={`h-4 w-4 text-muted transition-transform duration-200 ${isDoubanDropdownOpen ? 'rotate-180' : ''
                      }`}
                  />
                </div>

                {/* 下拉选项列表 */}
                {isDoubanDropdownOpen && (
                  <div className='a2-panel absolute z-50 mt-1 max-h-60 w-full overflow-auto bg-surface/95'>
                    {doubanDataSourceOptions.map((option) => (
                      <button
                        key={option.value}
                        type='button'
                        onClick={() => {
                          handleDoubanDataSourceChange(option.value);
                          setIsDoubanDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm theme-transition hover:bg-background/25 ${doubanDataSource === option.value
                          ? 'bg-accent/10 text-accent'
                          : 'text-foreground'
                          }`}
                      >
                        <span className='truncate'>{option.label}</span>
                        {doubanDataSource === option.value && (
                          <Check className='ml-2 h-4 w-4 flex-shrink-0 text-accent' />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 感谢信息 */}
              {getThanksInfo(doubanDataSource) && (
                <div className='mt-3'>
                  <button
                    type='button'
                    onClick={() =>
                      window.open(getThanksInfo(doubanDataSource)!.url, '_blank')
                    }
                    className='flex w-full cursor-pointer items-center justify-center gap-1.5 px-3 text-xs text-muted'
                  >
                    <span className='font-medium'>
                      {getThanksInfo(doubanDataSource)!.text}
                    </span>
                    <ExternalLink className='w-3.5 opacity-70' />
                  </button>
                </div>
              )}
            </div>

            {/* 豆瓣代理地址设置 - 仅在选择自定义代理时显示 */}
            {doubanDataSource === 'custom' && (
              <div className='space-y-3'>
                <div>
                  <h4 className='text-sm font-medium text-foreground'>
                    豆瓣代理地址
                  </h4>
                  <p className='mt-1 text-xs text-muted'>
                    自定义代理服务器地址
                  </p>
                </div>
                <input
                  type='text'
                  className='a2-field'
                  placeholder='例如: https://proxy.example.com/fetch?url='
                  value={doubanProxyUrl}
                  onChange={(e) => handleDoubanProxyUrlChange(e.target.value)}
                />
              </div>
            )}

            {/* 分割线 */}
            <div className='border-t border-border/70'></div>

            {/* 豆瓣图片代理设置 */}
            <div className='space-y-3'>
              <div>
                <h4 className='text-sm font-medium text-foreground'>
                  豆瓣图片代理
                </h4>
                <p className='mt-1 text-xs text-muted'>
                  选择获取豆瓣图片的方式
                </p>
              </div>
              <div className='relative' data-dropdown='douban-image-proxy'>
                {/* 自定义下拉选择框 */}
                <button
                  type='button'
                  onClick={() =>
                    setIsDoubanImageProxyDropdownOpen(
                      !isDoubanImageProxyDropdownOpen
                    )
                  }
                  className='a2-field pr-10 text-left'
                >
                  {
                    doubanImageProxyTypeOptions.find(
                      (option) => option.value === doubanImageProxyType
                    )?.label
                  }
                </button>

                {/* 下拉箭头 */}
                <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                  <ChevronDown
                    className={`h-4 w-4 text-muted transition-transform duration-200 ${isDoubanDropdownOpen ? 'rotate-180' : ''
                      }`}
                  />
                </div>

                {/* 下拉选项列表 */}
                {isDoubanImageProxyDropdownOpen && (
                  <div className='a2-panel absolute z-50 mt-1 max-h-60 w-full overflow-auto bg-surface/95'>
                    {doubanImageProxyTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type='button'
                        onClick={() => {
                          handleDoubanImageProxyTypeChange(option.value);
                          setIsDoubanImageProxyDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm theme-transition hover:bg-background/25 ${doubanImageProxyType === option.value
                          ? 'bg-accent/10 text-accent'
                          : 'text-foreground'
                          }`}
                      >
                        <span className='truncate'>{option.label}</span>
                        {doubanImageProxyType === option.value && (
                          <Check className='ml-2 h-4 w-4 flex-shrink-0 text-accent' />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 感谢信息 */}
              {getThanksInfo(doubanImageProxyType) && (
                <div className='mt-3'>
                  <button
                    type='button'
                    onClick={() =>
                      window.open(
                        getThanksInfo(doubanImageProxyType)!.url,
                        '_blank'
                      )
                    }
                    className='flex w-full cursor-pointer items-center justify-center gap-1.5 px-3 text-xs text-muted'
                  >
                    <span className='font-medium'>
                      {getThanksInfo(doubanImageProxyType)!.text}
                    </span>
                    <ExternalLink className='w-3.5 opacity-70' />
                  </button>
                </div>
              )}
            </div>

            {/* 豆瓣图片代理地址设置 - 仅在选择自定义代理时显示 */}
            {doubanImageProxyType === 'custom' && (
              <div className='space-y-3'>
                <div>
                  <h4 className='text-sm font-medium text-foreground'>
                    豆瓣图片代理地址
                  </h4>
                  <p className='mt-1 text-xs text-muted'>
                    自定义图片代理服务器地址
                  </p>
                </div>
                <input
                  type='text'
                  className='a2-field'
                  placeholder='例如: https://proxy.example.com/fetch?url='
                  value={doubanImageProxyUrl}
                  onChange={(e) =>
                    handleDoubanImageProxyUrlChange(e.target.value)
                  }
                />
              </div>
            )}

            {/* 分割线 */}
            <div className='border-t border-border/70'></div>

            {/* 默认聚合搜索结果 */}
            <div className='flex items-center justify-between'>
              <div>
                <h4 className='text-sm font-medium text-foreground'>
                  默认聚合搜索结果
                </h4>
                <p className='mt-1 text-xs text-muted'>
                  搜索时默认按标题和年份聚合显示结果
                </p>
              </div>
              <label className='flex items-center cursor-pointer'>
                <div className='relative'>
                  <input
                    type='checkbox'
                    className='sr-only peer'
                    checked={defaultAggregateSearch}
                    onChange={(e) => handleAggregateToggle(e.target.checked)}
                  />
                  <div className='h-6 w-11 border border-border/20 bg-surface-secondary/60 transition-colors peer-checked:border-accent/50 peer-checked:bg-accent/10'></div>
                  <div className='absolute left-0.5 top-0.5 h-5 w-5 bg-foreground transition-transform peer-checked:translate-x-5'></div>
                </div>
              </label>
            </div>

            {/* 优选和测速 */}
            <div className='flex items-center justify-between'>
              <div>
                <h4 className='text-sm font-medium text-foreground'>
                  优选和测速
                </h4>
                <p className='mt-1 text-xs text-muted'>
                  如出现播放器劫持问题可关闭
                </p>
              </div>
              <label className='flex items-center cursor-pointer'>
                <div className='relative'>
                  <input
                    type='checkbox'
                    className='sr-only peer'
                    checked={enableOptimization}
                    onChange={(e) => handleOptimizationToggle(e.target.checked)}
                  />
                  <div className='h-6 w-11 border border-border/20 bg-surface-secondary/60 transition-colors peer-checked:border-accent/50 peer-checked:bg-accent/10'></div>
                  <div className='absolute left-0.5 top-0.5 h-5 w-5 bg-foreground transition-transform peer-checked:translate-x-5'></div>
                </div>
              </label>
            </div>

            {/* 流式搜索 */}
            <div className='flex items-center justify-between'>
              <div>
                <h4 className='text-sm font-medium text-foreground'>
                  流式搜索输出
                </h4>
                <p className='mt-1 text-xs text-muted'>
                  启用搜索结果实时流式输出，关闭后使用传统一次性搜索
                </p>
              </div>
              <label className='flex items-center cursor-pointer'>
                <div className='relative'>
                  <input
                    type='checkbox'
                    className='sr-only peer'
                    checked={fluidSearch}
                    onChange={(e) => handleFluidSearchToggle(e.target.checked)}
                  />
                  <div className='h-6 w-11 border border-border/20 bg-surface-secondary/60 transition-colors peer-checked:border-accent/50 peer-checked:bg-accent/10'></div>
                  <div className='absolute left-0.5 top-0.5 h-5 w-5 bg-foreground transition-transform peer-checked:translate-x-5'></div>
                </div>
              </label>
            </div>

            {/* 直播视频浏览器直连 */}
            <div className='flex items-center justify-between'>
              <div>
                <h4 className='text-sm font-medium text-foreground'>
                  IPTV 视频浏览器直连
                </h4>
                <p className='mt-1 text-xs text-muted'>
                  开启 IPTV 视频浏览器直连时，需要自备 Allow CORS 插件
                </p>
              </div>
              <label className='flex items-center cursor-pointer'>
                <div className='relative'>
                  <input
                    type='checkbox'
                    className='sr-only peer'
                    checked={liveDirectConnect}
                    onChange={(e) => handleLiveDirectConnectToggle(e.target.checked)}
                  />
                  <div className='h-6 w-11 border border-border/20 bg-surface-secondary/60 transition-colors peer-checked:border-accent/50 peer-checked:bg-accent/10'></div>
                  <div className='absolute left-0.5 top-0.5 h-5 w-5 bg-foreground transition-transform peer-checked:translate-x-5'></div>
                </div>
              </label>
            </div>
          </div>

          {/* 底部说明 */}
          <div className='mt-6 border-t border-border/70 pt-4'>
            <p className='text-center text-xs text-muted'>
              这些设置保存在本地浏览器中
            </p>
          </div>
        </div>
      </div>
    </>
  );

  // 修改密码面板内容
  const changePasswordPanel = (
    <>
      {/* 背景遮罩 */}
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000]'
        onClick={handleCloseChangePassword}
        onTouchMove={(e) => {
          // 只阻止滚动，允许其他触摸事件
          e.preventDefault();
        }}
        onWheel={(e) => {
          // 阻止滚轮滚动
          e.preventDefault();
        }}
        style={{
          touchAction: 'none',
        }}
      />

      {/* 修改密码面板 */}
      <div
        className='a2-panel fixed left-1/2 top-1/2 z-[1001] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-surface/95'
      >
        {/* 内容容器 - 独立的滚动区域 */}
        <div
          className='h-full p-6'
          data-panel-content
          onTouchMove={(e) => {
            // 阻止事件冒泡到遮罩层，但允许内部滚动
            e.stopPropagation();
          }}
          style={{
            touchAction: 'auto', // 允许所有触摸操作
          }}
        >
          {/* 标题栏 */}
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-xl font-semibold tracking-[-0.045em] text-foreground'>
              修改密码
            </h3>
            <button
              onClick={handleCloseChangePassword}
              className='a2-icon-button h-8 w-8 p-1.5'
              aria-label='Close'
            >
              <X className='w-full h-full' />
            </button>
          </div>

          {/* 表单 */}
          <div className='space-y-4'>
            {/* 新密码输入 */}
            <div>
              <label className='mb-2 block text-sm font-medium text-foreground'>
                新密码
              </label>
              <input
                type='password'
                className='a2-field'
                placeholder='请输入新密码'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={passwordLoading}
              />
            </div>

            {/* 确认密码输入 */}
            <div>
              <label className='mb-2 block text-sm font-medium text-foreground'>
                确认密码
              </label>
              <input
                type='password'
                className='a2-field'
                placeholder='请再次输入新密码'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={passwordLoading}
              />
            </div>

            {/* 错误信息 */}
            {passwordError && (
              <div className='border border-danger/30 bg-danger/10 p-3 text-sm text-danger'>
                {passwordError}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className='mt-6 flex gap-3 border-t border-border/70 pt-4'>
            <button
              onClick={handleCloseChangePassword}
              className='a2-button flex-1'
              disabled={passwordLoading}
            >
              取消
            </button>
            <button
              onClick={handleSubmitChangePassword}
              className='a2-button a2-button-accent flex-1'
              disabled={passwordLoading || !newPassword || !confirmPassword}
            >
              {passwordLoading ? '修改中...' : '确认修改'}
            </button>
          </div>

          {/* 底部说明 */}
          <div className='mt-4 border-t border-border/70 pt-4'>
            <p className='text-center text-xs text-muted'>
              修改密码后需要重新登录
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Dropdown isOpen={isOpen} onOpenChange={setIsOpen}>
        <AppIconButton
          className={`a2-icon-button overflow-hidden ${isMobile ? 'h-8 w-8 p-0.5' : 'h-10 w-10 p-0.5'}`}
          aria-label='User Menu'
        >
          <span className='relative flex h-full w-full items-center justify-center overflow-hidden'>
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt='用户头像'
                fill
                sizes='40px'
                className='object-cover'
              />
            ) : (
              <User className='h-6 w-6' />
            )}
          </span>
        </AppIconButton>
        <Dropdown.Popover className='w-64'>
          <Dropdown.Menu
            aria-label='用户菜单'
            onAction={(key) => {
              switch (String(key)) {
                case 'settings':
                  handleSettings();
                  break;
                case 'admin':
                  handleAdminPanel();
                  break;
                case 'avatar':
                  handleChangeAvatar();
                  break;
                case 'password':
                  handleChangePassword();
                  break;
                case 'logout':
                  handleLogout();
                  break;
                case 'version':
                  setIsVersionPanelOpen(true);
                  handleCloseMenu();
                  break;
                default:
                  break;
              }
            }}
          >
            <Dropdown.Item id='profile' textValue='当前用户'>
              <div className='flex items-center gap-3'>
                <div className='relative h-10 w-10 flex-shrink-0 overflow-hidden border border-border/70'>
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt='用户头像'
                      fill
                      sizes='40px'
                      className='object-cover'
                    />
                  ) : (
                    <div className='flex h-full w-full items-center justify-center bg-surface-secondary/60'>
                      <User className='h-6 w-6 text-accent' />
                    </div>
                  )}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-semibold text-foreground'>
                    {authInfo?.username || 'default'}
                  </p>
                  <p className='text-xs text-muted'>
                    {getRoleText(authInfo?.role || 'user')} ·{' '}
                    {storageType === 'localstorage' ? '本地' : storageType}
                  </p>
                </div>
              </div>
            </Dropdown.Item>
            <Dropdown.Item id='settings' textValue='设置'>
              <Settings className='h-4 w-4 text-muted' />
              <Label>设置</Label>
            </Dropdown.Item>
            {showAdminPanel ? (
              <Dropdown.Item id='admin' textValue='管理面板'>
                <Shield className='h-4 w-4 text-muted' />
                <Label>管理面板</Label>
              </Dropdown.Item>
            ) : null}
            <Dropdown.Item id='avatar' textValue='修改头像'>
              <Camera className='h-4 w-4 text-muted' />
              <Label>修改头像</Label>
            </Dropdown.Item>
            {showChangePassword ? (
              <Dropdown.Item id='password' textValue='修改密码'>
                <KeyRound className='h-4 w-4 text-muted' />
                <Label>修改密码</Label>
              </Dropdown.Item>
            ) : null}
            <Dropdown.Item id='logout' textValue='登出' variant='danger'>
              <LogOut className='h-4 w-4 text-danger' />
              <Label>登出</Label>
            </Dropdown.Item>
            <Dropdown.Item id='version' textValue={`v${CURRENT_VERSION}`}>
              <ExternalLink className='h-4 w-4 text-muted' />
              <Label>v{CURRENT_VERSION}</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
        {updateStatus === UpdateStatus.HAS_UPDATE && (
          <div className='absolute right-[2px] top-[2px] h-2 w-2 bg-warning'></div>
        )}
      </Dropdown>

      {/* 使用 Portal 将设置面板渲染到 document.body */}
      {isSettingsOpen && mounted && createPortal(settingsPanel, document.body)}

      {/* 使用 Portal 将修改密码面板渲染到 document.body */}
      {isChangePasswordOpen &&
        mounted &&
        createPortal(changePasswordPanel, document.body)}

      {/* 使用 Portal 将修改头像面板渲染到 document.body */}
      {isChangeAvatarOpen &&
        mounted &&
        createPortal(
          <>
            {/* 背景遮罩 */}
            <div
              className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000]'
              onClick={handleCloseChangeAvatar}
              onTouchMove={(e) => e.preventDefault()}
              onWheel={(e) => e.preventDefault()}
              style={{ touchAction: 'none' }}
            />

            {/* 修改头像面板 */}
            <div className='a2-panel fixed left-1/2 top-1/2 z-[1001] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-surface/95'>
              <div className='p-6'>
                {/* 标题栏 */}
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold tracking-[-0.045em] text-foreground'>
                    修改头像
                  </h3>
                  <button
                    onClick={handleCloseChangeAvatar}
                    className='a2-icon-button h-8 w-8 p-1.5'
                    aria-label='Close'
                  >
                    <X className='w-full h-full' />
                  </button>
                </div>

                {!showCropper ? (
                  <>
                    {/* 头像预览 */}
                    <div className='flex flex-col items-center justify-center gap-6 my-6'>
                      <div className='relative h-24 w-24 overflow-hidden border border-border/70'>
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt="用户头像"
                            fill
                            sizes="96px"
                            className='object-cover'
                          />
                        ) : (
                          <div className='flex h-full w-full items-center justify-center bg-surface-secondary/60'>
                            <User className='h-12 w-12 text-accent' />
                          </div>
                        )}
                      </div>

                      {/* 上传按钮 */}
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarSelected}
                          disabled={isUploadingAvatar}
                        />
                        <button
                          onClick={handleOpenFileSelector}
                          disabled={isUploadingAvatar}
                          className='a2-button a2-button-accent flex items-center gap-2'
                        >
                          <Upload className='w-4 h-4' />
                          选择图片
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* 图片裁剪界面 */}
                    <div className='flex flex-col items-center justify-center gap-4 my-6'>
                      <div className='w-full max-w-md'>
                        <ReactCrop
                          crop={crop}
                          onChange={(_: PixelCrop, percentCrop: PercentCrop) => setCrop(percentCrop)}
                          onComplete={(crop: PixelCrop) => setCompletedCrop(crop)}
                          aspect={1}
                          circularCrop
                        >
                          <img
                            ref={imageRef}
                            src={selectedImage}
                            alt="Crop me"
                            className="max-w-full max-h-64 object-contain"
                            onLoad={onImageLoad}
                          />
                        </ReactCrop>
                      </div>

                      <div className='flex gap-3'>
                        <button
                          onClick={() => {
                            setShowCropper(false);
                            setSelectedImage('');
                            setCompletedCrop(undefined);
                            setCrop({
                              unit: '%',
                              width: 80,
                              height: 80,
                              x: 10,
                              y: 10,
                            });
                            // 重置文件输入
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className='a2-button'
                        >
                          重新选择
                        </button>
                        <button
                          onClick={handleConfirmCrop}
                          disabled={isUploadingAvatar || !completedCrop}
                          className='a2-button a2-button-accent flex items-center gap-2'
                        >
                          <Check className='w-4 h-4' />
                          {isUploadingAvatar ? '上传中...' : '确认上传'}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* 底部提示 */}
                <p className='mt-4 border-t border-border/70 pt-4 text-center text-xs text-muted'>
                  支持 JPG、PNG、GIF 等格式，文件大小不超过 2MB
                </p>
              </div>
            </div>
          </>,
          document.body
        )}

      {/* 版本面板 */}
      <VersionPanel
        isOpen={isVersionPanelOpen}
        onClose={() => setIsVersionPanelOpen(false)}
      />
    </>
  );
};
