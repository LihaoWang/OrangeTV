/* eslint-disable no-console,@typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

'use client';

import {
  Alert,
  Badge,
  Button,
  Dropdown,
  Input,
  Label,
  Switch,
  TextField,
} from '@heroui/react';
import {
  Camera,
  Check,
  ExternalLink,
  KeyRound,
  LogOut,
  Settings,
  Shield,
  User,
  Upload,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ReactCrop, { Crop, PercentCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { getAuthInfoFromBrowserCookie } from '@/lib/auth';
import { CURRENT_VERSION } from '@/lib/version';
import { checkForUpdates, UpdateStatus } from '@/lib/version_check';

import { VersionPanel } from './VersionPanel';
import { useToast } from './Toast';
import { AppDialog, AppFilterSelect, AppIconButton } from './ui/HeroPrimitives';

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

  const settingsPanel = (
    <AppDialog
      isOpen={isSettingsOpen}
      onOpenChange={(open) => {
        if (!open) handleCloseSettings();
      }}
      title='本地设置'
      description='这些设置保存在本地浏览器中'
      size='lg'
    >
      <div className='space-y-6'>
        <div className='flex justify-end'>
          <Button variant='danger' size='sm' onPress={handleResetSettings}>
            恢复默认
          </Button>
        </div>

        <section className='space-y-3'>
          <AppFilterSelect
            ariaLabel='豆瓣数据代理选项'
            label='豆瓣数据代理'
            options={doubanDataSourceOptions}
            value={doubanDataSource}
            onChange={handleDoubanDataSourceChange}
          />
          {getThanksInfo(doubanDataSource) ? (
            <Button
              variant='ghost'
              size='sm'
              onPress={() =>
                window.open(getThanksInfo(doubanDataSource)!.url, '_blank')
              }
            >
              {getThanksInfo(doubanDataSource)!.text}
              <ExternalLink className='h-3.5 w-3.5' />
            </Button>
          ) : null}
          {doubanDataSource === 'custom' ? (
            <TextField>
              <Label>豆瓣代理地址</Label>
              <Input
                type='text'
                placeholder='例如: https://proxy.example.com/fetch?url='
                value={doubanProxyUrl}
                onChange={(e) => handleDoubanProxyUrlChange(e.target.value)}
              />
            </TextField>
          ) : null}
        </section>

        <section className='space-y-3'>
          <AppFilterSelect
            ariaLabel='豆瓣图片代理选项'
            label='豆瓣图片代理'
            options={doubanImageProxyTypeOptions}
            value={doubanImageProxyType}
            onChange={handleDoubanImageProxyTypeChange}
          />
          {getThanksInfo(doubanImageProxyType) ? (
            <Button
              variant='ghost'
              size='sm'
              onPress={() =>
                window.open(getThanksInfo(doubanImageProxyType)!.url, '_blank')
              }
            >
              {getThanksInfo(doubanImageProxyType)!.text}
              <ExternalLink className='h-3.5 w-3.5' />
            </Button>
          ) : null}
          {doubanImageProxyType === 'custom' ? (
            <TextField>
              <Label>豆瓣图片代理地址</Label>
              <Input
                type='text'
                placeholder='例如: https://proxy.example.com/fetch?url='
                value={doubanImageProxyUrl}
                onChange={(e) =>
                  handleDoubanImageProxyUrlChange(e.target.value)
                }
              />
            </TextField>
          ) : null}
        </section>

        <div className='space-y-4'>
          <Switch
            isSelected={defaultAggregateSearch}
            onChange={handleAggregateToggle}
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Content>
              <div>
                <p className='text-sm font-medium'>默认聚合搜索结果</p>
                <p className='text-xs text-muted'>
                  搜索时默认按标题和年份聚合显示结果
                </p>
              </div>
            </Switch.Content>
          </Switch>

          <Switch
            isSelected={enableOptimization}
            onChange={handleOptimizationToggle}
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Content>
              <div>
                <p className='text-sm font-medium'>优选和测速</p>
                <p className='text-xs text-muted'>如出现播放器劫持问题可关闭</p>
              </div>
            </Switch.Content>
          </Switch>

          <Switch isSelected={fluidSearch} onChange={handleFluidSearchToggle}>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Content>
              <div>
                <p className='text-sm font-medium'>流式搜索输出</p>
                <p className='text-xs text-muted'>
                  启用搜索结果实时流式输出，关闭后使用传统一次性搜索
                </p>
              </div>
            </Switch.Content>
          </Switch>

          <Switch
            isSelected={liveDirectConnect}
            onChange={handleLiveDirectConnectToggle}
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Content>
              <div>
                <p className='text-sm font-medium'>IPTV 视频浏览器直连</p>
                <p className='text-xs text-muted'>
                  开启 IPTV 视频浏览器直连时，需要自备 Allow CORS 插件
                </p>
              </div>
            </Switch.Content>
          </Switch>
        </div>
      </div>
    </AppDialog>
  );

  const changePasswordPanel = (
    <AppDialog
      isOpen={isChangePasswordOpen}
      onOpenChange={(open) => {
        if (!open) handleCloseChangePassword();
      }}
      title='修改密码'
      description='修改密码后需要重新登录'
      size='sm'
      footer={
        <div className='flex w-full gap-3'>
          <Button
            className='flex-1'
            variant='secondary'
            onPress={handleCloseChangePassword}
            isDisabled={passwordLoading}
          >
            取消
          </Button>
          <Button
            className='flex-1'
            onPress={handleSubmitChangePassword}
            isDisabled={passwordLoading || !newPassword || !confirmPassword}
            isPending={passwordLoading}
          >
            {passwordLoading ? '修改中...' : '确认修改'}
          </Button>
        </div>
      }
    >
      <div className='space-y-4'>
        <TextField>
          <Label>新密码</Label>
          <Input
            type='password'
            placeholder='请输入新密码'
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={passwordLoading}
          />
        </TextField>

        <TextField>
          <Label>确认密码</Label>
          <Input
            type='password'
            placeholder='请再次输入新密码'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={passwordLoading}
          />
        </TextField>

        {passwordError ? (
          <Alert status='danger'>
            <Alert.Content>
              <Alert.Description>{passwordError}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}
      </div>
    </AppDialog>
  );

  return (
    <>
      <Dropdown isOpen={isOpen} onOpenChange={setIsOpen}>
        <AppIconButton
          size={isMobile ? 'sm' : 'md'}
          className='overflow-hidden'
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
          <Badge color='warning' size='sm' className='absolute right-[2px] top-[2px]' />
        )}
      </Dropdown>

      {mounted && settingsPanel}

      {mounted && changePasswordPanel}

      {mounted && (
        <AppDialog
          isOpen={isChangeAvatarOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseChangeAvatar();
          }}
          title='修改头像'
          description='支持 JPG、PNG、GIF 等格式，文件大小不超过 2MB'
          size='sm'
        >
          {!showCropper ? (
            <div className='flex flex-col items-center justify-center gap-6 py-4'>
              <div className='relative h-24 w-24 overflow-hidden'>
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt='用户头像'
                    fill
                    sizes='96px'
                    className='object-cover'
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center bg-surface-secondary/60'>
                    <User className='h-12 w-12 text-accent' />
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={handleAvatarSelected}
                disabled={isUploadingAvatar}
              />
              <Button
                onPress={handleOpenFileSelector}
                isDisabled={isUploadingAvatar}
              >
                <Upload className='h-4 w-4' />
                选择图片
              </Button>
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center gap-4 py-4'>
              <div className='w-full max-w-md'>
                <ReactCrop
                  crop={crop}
                  onChange={(_: PixelCrop, percentCrop: PercentCrop) =>
                    setCrop(percentCrop)
                  }
                  onComplete={(crop: PixelCrop) => setCompletedCrop(crop)}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imageRef}
                    src={selectedImage}
                    alt='Crop me'
                    className='max-h-64 max-w-full object-contain'
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              </div>

              <div className='flex gap-3'>
                <Button
                  variant='tertiary'
                  onPress={() => {
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
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  重新选择
                </Button>
                <Button
                  onPress={handleConfirmCrop}
                  isDisabled={isUploadingAvatar || !completedCrop}
                  isPending={isUploadingAvatar}
                >
                  <Check className='h-4 w-4' />
                  {isUploadingAvatar ? '上传中...' : '确认上传'}
                </Button>
              </div>
            </div>
          )}
        </AppDialog>
      )}

      {/* 版本面板 */}
      <VersionPanel
        isOpen={isVersionPanelOpen}
        onClose={() => setIsVersionPanelOpen(false)}
      />
    </>
  );
};
