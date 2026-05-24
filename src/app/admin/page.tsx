/* eslint-disable @typescript-eslint/no-explicit-any, no-console, @typescript-eslint/no-non-null-assertion,react-hooks/exhaustive-deps,@typescript-eslint/no-empty-function */

'use client';

import {
  closestCenter,
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Database,
  ExternalLink,
  FileText,
  FolderOpen,
  Settings,
  Tv,
  User,
  Users,
  Video,
} from 'lucide-react';
import { GripVertical, Palette } from 'lucide-react';
import { Alert, Avatar, Button, Card, Checkbox, Chip, Input, Label, Skeleton, Switch, Table, TextArea, TextField } from '@heroui/react';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AdminConfig, AdminConfigResult } from '../../lib/admin.types';
import { getAuthInfoFromBrowserCookie } from '@/lib/auth';

import DataMigration from '@/components/DataMigration';
import ThemeManager from '@/components/ThemeManager';
import PageLayout from '@/components/PageLayout';
import { AppDialog, AppFilterSelect } from '@/components/ui/HeroPrimitives';

// 统一按钮样式系统
const buttonStyles = {
  // 主要操作按钮（蓝色）- 用于配置、设置、确认等
  primary: 'px-3 py-1.5 text-sm font-medium bg-accent hover:bg-accent-strong text-accent-foreground rounded-xl transition-colors',
  // 成功操作按钮（绿色）- 用于添加、启用、保存等
  success: 'px-3 py-1.5 text-sm font-medium bg-accent hover:bg-accent-strong text-accent-foreground rounded-xl transition-colors',
  // 危险操作按钮（红色）- 用于删除、禁用、重置等
  danger: 'px-3 py-1.5 text-sm font-medium bg-danger hover:bg-danger/90 text-white rounded-xl transition-colors',
  // 次要操作按钮（灰色）- 用于取消、关闭等
  secondary: 'px-3 py-1.5 text-sm font-medium bg-surface-secondary hover:bg-surface-tertiary text-foreground border border-border rounded-xl transition-colors',
  // 警告操作按钮（黄色）- 用于批量禁用等
  warning: 'px-3 py-1.5 text-sm font-medium bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white rounded-lg transition-colors',
  // 小尺寸主要按钮
  primarySmall: 'px-2 py-1 text-xs font-medium bg-accent hover:bg-accent-strong text-accent-foreground rounded-lg transition-colors',
  // 小尺寸成功按钮
  successSmall: 'px-2 py-1 text-xs font-medium bg-accent hover:bg-accent-strong text-accent-foreground rounded-lg transition-colors',
  // 小尺寸危险按钮
  dangerSmall: 'px-2 py-1 text-xs font-medium bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-md transition-colors',
  // 小尺寸次要按钮
  secondarySmall: 'px-2 py-1 text-xs font-medium bg-surface-secondary hover:bg-surface-tertiary text-foreground border border-border rounded-lg transition-colors',
  // 小尺寸警告按钮
  warningSmall: 'px-2 py-1 text-xs font-medium bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white rounded-md transition-colors',
  // 圆角小按钮（用于表格操作）
  roundedPrimary: 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-accent/10 text-accent hover:bg-accent/15 transition-colors',
  roundedSuccess: 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-accent/10 text-accent hover:bg-accent/15 transition-colors',
  roundedDanger: 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-200 transition-colors',
  roundedSecondary: 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-surface-secondary text-foreground hover:bg-surface-tertiary transition-colors',
  roundedWarning: 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:hover:bg-yellow-900/60 dark:text-yellow-200 transition-colors',
  roundedPurple: 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-accent/10 text-accent hover:bg-accent/15 transition-colors',
  // 禁用状态
  disabled: 'px-3 py-1.5 text-sm font-medium bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white rounded-lg transition-colors',
  disabledSmall: 'px-2 py-1 text-xs font-medium bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white rounded-md transition-colors',
  // 开关按钮样式
  toggleOn: 'bg-accent',
  toggleOff: 'bg-surface-tertiary',
  toggleThumb: 'bg-surface',
  toggleThumbOn: 'translate-x-6',
  toggleThumbOff: 'translate-x-1',
  // 快速操作按钮样式
  quickAction: 'px-3 py-1.5 text-xs font-medium text-muted bg-surface border border-border hover:bg-surface-secondary rounded-lg transition-colors',
};

const AdminTable = ({
  ariaLabel,
  minWidth = 'min-w-[900px]',
  children,
}: {
  ariaLabel: string;
  minWidth?: string;
  children: React.ReactNode;
}) => (
  <Table variant='secondary' className='overflow-visible'>
    <Table.ScrollContainer>
      <Table.Content aria-label={ariaLabel} className={minWidth}>
        {children}
      </Table.Content>
    </Table.ScrollContainer>
  </Table>
);

const AdminCheckbox = ({
  ariaLabel,
  isSelected,
  onChange,
  isDisabled,
}: {
  ariaLabel: string;
  isSelected: boolean;
  onChange: (isSelected: boolean) => void;
  isDisabled?: boolean;
}) => (
  <Checkbox
    aria-label={ariaLabel}
    isSelected={isSelected}
    isDisabled={isDisabled}
    slot='selection'
    variant='secondary'
    onChange={onChange}
  >
    <Checkbox.Control>
      <Checkbox.Indicator />
    </Checkbox.Control>
  </Checkbox>
);

const AdminChip = ({
  children,
  color = 'default',
}: {
  children: React.ReactNode;
  color?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
}) => (
  <Chip size='sm' color={color} variant='soft'>
    <Chip.Label>{children}</Chip.Label>
  </Chip>
);

const AdminSettingSwitch = ({
  label,
  description,
  isSelected,
  onChange,
}: {
  label: string;
  description: string;
  isSelected: boolean;
  onChange: (isSelected: boolean) => void;
}) => (
  <div className='flex items-start justify-between gap-4'>
    <div className='space-y-1'>
      <Label className='text-sm'>{label}</Label>
      <p className='text-xs text-muted'>{description}</p>
    </div>
    <Switch aria-label={label} isSelected={isSelected} onChange={onChange}>
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
    </Switch>
  </div>
);

// 获取用户头像的函数
const getUserAvatar = async (username: string): Promise<string | null> => {
  try {
    const response = await fetch(`/api/avatar?user=${encodeURIComponent(username)}`);
    if (response.ok) {
      const data = await response.json();
      return data.avatar || null;
    }
  } catch (error) {
    console.error('获取头像失败:', error);
  }
  return null;
};

// 用户头像组件
interface UserAvatarProps {
  username: string;
  size?: 'sm' | 'md' | 'lg';
}

const UserAvatar = ({ username, size = 'sm' }: UserAvatarProps) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvatar = async () => {
      setLoading(true);
      const avatar = await getUserAvatar(username);
      setAvatarUrl(avatar);
      setLoading(false);
    };

    fetchAvatar();
  }, [username]);

  return (
    <Avatar size={size}>
      {loading ? (
        <Avatar.Fallback>
          <Skeleton className='h-full w-full' />
        </Avatar.Fallback>
      ) : avatarUrl ? (
        <Avatar.Image src={avatarUrl} alt={`${username} 的头像`} />
      ) : (
        <Avatar.Fallback>
          <User className='h-4 w-4' />
        </Avatar.Fallback>
      )}
    </Avatar>
  );
};

// 机器码单元格组件
interface MachineCodeCellProps {
  username: string;
  canManage: boolean;
  machineCodeData: Record<string, { machineCode: string; deviceInfo?: string; bindTime: number }>;
  onRefresh: () => void;
  showAlert: (config: any) => void;
}

const MachineCodeCell = ({ username, canManage, machineCodeData, onRefresh, showAlert }: MachineCodeCellProps) => {
  const [unbinding, setUnbinding] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('bottom');
  const tooltipRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLElement>(null);

  const machineCodeInfo = machineCodeData[username] || null;

  // 智能定位逻辑
  const handleMouseEnter = useCallback(() => {
    if (!codeRef.current) return;

    const element = codeRef.current;
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    if (rect.top < viewportHeight / 2) {
      setTooltipPosition('bottom');
    } else {
      setTooltipPosition('top');
    }
  }, []);

  // 解绑机器码
  const handleUnbind = async () => {
    if (!machineCodeInfo || !canManage) return;

    try {
      setUnbinding(true);
      const response = await fetch('/api/machine-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unbind',
          targetUser: username,
        }),
      });

      if (response.ok) {
        showSuccess('机器码解绑成功', showAlert);
        onRefresh(); // 刷新数据
      } else {
        const error = await response.json();
        showError(`解绑失败: ${error.error || '未知错误'}`, showAlert);
      }
    } catch (error) {
      console.error('解绑机器码失败:', error);
      showError('解绑失败，请重试', showAlert);
    } finally {
      setUnbinding(false);
    }
  };

  const formatMachineCode = (code: string) => {
    if (code.length !== 32) return code;
    return code.match(/.{1,4}/g)?.join('-') || code;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  if (!machineCodeInfo) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted">未绑定</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center space-x-2">
        <div className="group relative" onMouseEnter={handleMouseEnter}>
          <code
            ref={codeRef}
            className="text-xs font-mono text-foreground cursor-help"
          >
            {formatMachineCode(machineCodeInfo.machineCode).substring(0, 12)}...
          </code>
          {/* 悬停显示完整机器码 - 智能定位 */}
          <div
            ref={tooltipRef}
            className={`absolute left-0 px-3 py-2 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none z-50 ${tooltipPosition === 'bottom'
              ? 'top-full mt-2'
              : 'bottom-full mb-2'
              }`}
          >
            <div className="font-mono">
              {formatMachineCode(machineCodeInfo.machineCode)}
            </div>
            {machineCodeInfo.deviceInfo && (
              <div className="mt-1 text-gray-300">
                {machineCodeInfo.deviceInfo}
              </div>
            )}
            <div className="mt-1 text-gray-400">
              绑定时间: {formatDate(machineCodeInfo.bindTime)}
            </div>
            {/* 箭头 - 根据位置动态调整 */}
            <div className={`absolute left-4 w-0 h-0 border-l-4 border-r-4 border-transparent ${tooltipPosition === 'bottom'
              ? 'bottom-full border-b-4 border-b-gray-800'
              : 'top-full border-t-4 border-t-gray-800'
              }`}></div>
          </div>
        </div>
        {canManage && (
          <Button
            size='sm'
            variant='danger-soft'
            onPress={handleUnbind}
            isDisabled={unbinding}
          >
            {unbinding ? '解绑中...' : '解绑'}
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-1">
        <AdminChip color='success'>已绑定</AdminChip>
      </div>
    </div>
  );
};

// 通用弹窗组件
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning';
  title: string;
  message?: string;
  timer?: number;
  showConfirm?: boolean;
}

const AlertModal = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  timer,
  showConfirm = false
}: AlertModalProps) => {
  useEffect(() => {
    if (isOpen && timer) {
      const timeout = setTimeout(onClose, timer);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, timer, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getStatus = () => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'accent';
    }
  };

  return (
    <AppDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={title}
      icon={getIcon()}
      footer={
        showConfirm ? (
          <Button variant='primary' onPress={onClose}>
            确定
          </Button>
        ) : null
      }
    >
      {message ? <Alert status={getStatus()}>{message}</Alert> : null}
    </AppDialog>
  );
};

// 弹窗状态管理
const useAlertModal = () => {
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message?: string;
    timer?: number;
    showConfirm?: boolean;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
  });

  const showAlert = (config: Omit<typeof alertModal, 'isOpen'>) => {
    setAlertModal({ ...config, isOpen: true });
  };

  const hideAlert = () => {
    setAlertModal(prev => ({ ...prev, isOpen: false }));
  };

  return { alertModal, showAlert, hideAlert };
};

// 统一弹窗方法（必须在首次使用前定义）
const showError = (message: string, showAlert?: (config: any) => void) => {
  if (showAlert) {
    showAlert({ type: 'error', title: '错误', message, showConfirm: true });
  } else {
    console.error(message);
  }
};

const showSuccess = (message: string, showAlert?: (config: any) => void) => {
  if (showAlert) {
    showAlert({ type: 'success', title: '成功', message, timer: 2000 });
  } else {
    console.log(message);
  }
};

// 通用加载状态管理系统
interface LoadingState {
  [key: string]: boolean;
}

const useLoadingState = () => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  };

  const isLoading = (key: string) => loadingStates[key] || false;

  const withLoading = async (key: string, operation: () => Promise<any>): Promise<any> => {
    setLoading(key, true);
    try {
      const result = await operation();
      return result;
    } finally {
      setLoading(key, false);
    }
  };

  return { loadingStates, setLoading, isLoading, withLoading };
};

// 新增站点配置类型
interface SiteConfig {
  SiteName: string;
  Announcement: string;
  SearchDownstreamMaxPage: number;
  SiteInterfaceCacheTime: number;
  DoubanProxyType: string;
  DoubanProxy: string;
  DoubanImageProxyType: string;
  DoubanImageProxy: string;
  DisableYellowFilter: boolean;
  FluidSearch: boolean;
  RequireDeviceCode: boolean;
}

// 视频源数据类型
interface DataSource {
  name: string;
  key: string;
  api: string;
  detail?: string;
  disabled?: boolean;
  from: 'config' | 'custom';
}

// 直播源数据类型
interface LiveDataSource {
  name: string;
  key: string;
  url: string;
  ua?: string;
  epg?: string;
  channelNumber?: number;
  disabled?: boolean;
  from: 'config' | 'custom';
}

// 自定义分类数据类型
interface CustomCategory {
  name?: string;
  type: 'movie' | 'tv';
  query: string;
  disabled?: boolean;
  from: 'config' | 'custom';
}

// 可折叠标签组件
interface CollapsibleTabProps {
  title: string;
  icon?: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleTab = ({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
}: CollapsibleTabProps) => {
  return (
    <Card variant='default' className='mb-4 overflow-hidden'>
      <Button
        fullWidth
        variant='tertiary'
        className='h-auto justify-between px-6 py-4'
        onPress={onToggle}
      >
        <div className='flex items-center gap-3'>
          {icon}
          <h3 className='text-lg font-semibold text-foreground'>
            {title}
          </h3>
        </div>
        <div className='text-muted'>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </Button>

      {isExpanded && <div className='px-6 py-4'>{children}</div>}
    </Card>
  );
};

// 用户配置组件
interface UserConfigProps {
  config: AdminConfig | null;
  role: 'owner' | 'admin' | null;
  refreshConfig: () => Promise<void>;
  machineCodeUsers: Record<string, { machineCode: string; deviceInfo?: string; bindTime: number }>;
  fetchMachineCodeUsers: () => Promise<void>;
}

const UserConfig = ({ config, role, refreshConfig, machineCodeUsers, fetchMachineCodeUsers }: UserConfigProps) => {
  const { alertModal, showAlert, hideAlert } = useAlertModal();
  const { isLoading, withLoading } = useLoadingState();
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [showAddUserGroupForm, setShowAddUserGroupForm] = useState(false);
  const [showEditUserGroupForm, setShowEditUserGroupForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    userGroup: '', // 新增用户组字段
  });
  const [changePasswordUser, setChangePasswordUser] = useState({
    username: '',
    password: '',
  });
  const [newUserGroup, setNewUserGroup] = useState({
    name: '',
    enabledApis: [] as string[],
  });
  const [editingUserGroup, setEditingUserGroup] = useState<{
    name: string;
    enabledApis: string[];
  } | null>(null);
  const [showConfigureApisModal, setShowConfigureApisModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    username: string;
    role: 'user' | 'admin' | 'owner';
    enabledApis?: string[];
    tags?: string[];
  } | null>(null);
  const [selectedApis, setSelectedApis] = useState<string[]>([]);
  const [showConfigureUserGroupModal, setShowConfigureUserGroupModal] = useState(false);
  const [selectedUserForGroup, setSelectedUserForGroup] = useState<{
    username: string;
    role: 'user' | 'admin' | 'owner';
    tags?: string[];
  } | null>(null);
  const [selectedUserGroups, setSelectedUserGroups] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBatchUserGroupModal, setShowBatchUserGroupModal] = useState(false);
  const [selectedUserGroup, setSelectedUserGroup] = useState<string>('');
  const [showDeleteUserGroupModal, setShowDeleteUserGroupModal] = useState(false);
  const [deletingUserGroup, setDeletingUserGroup] = useState<{
    name: string;
    affectedUsers: Array<{ username: string; role: 'user' | 'admin' | 'owner' }>;
  } | null>(null);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  // 当前登录用户名
  const currentUsername = getAuthInfoFromBrowserCookie()?.username || null;

  // 使用 useMemo 计算全选状态，避免每次渲染都重新计算
  const selectAllUsers = useMemo(() => {
    const selectableUserCount = config?.UserConfig?.Users?.filter(user =>
    (role === 'owner' ||
      (role === 'admin' &&
        (user.role === 'user' ||
          user.username === currentUsername)))
    ).length || 0;
    return selectedUsers.size === selectableUserCount && selectedUsers.size > 0;
  }, [selectedUsers.size, config?.UserConfig?.Users, role, currentUsername]);

  // 获取用户组列表
  const userGroups = config?.UserConfig?.Tags || [];

  // 处理用户组相关操作
  const handleUserGroupAction = async (
    action: 'add' | 'edit' | 'delete',
    groupName: string,
    enabledApis?: string[]
  ) => {
    return withLoading(`userGroup_${action}_${groupName}`, async () => {
      try {
        const res = await fetch('/api/admin/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'userGroup',
            groupAction: action,
            groupName,
            enabledApis,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `操作失败: ${res.status}`);
        }

        await refreshConfig();

        if (action === 'add') {
          setNewUserGroup({ name: '', enabledApis: [] });
          setShowAddUserGroupForm(false);
        } else if (action === 'edit') {
          setEditingUserGroup(null);
          setShowEditUserGroupForm(false);
        }

        showSuccess(action === 'add' ? '用户组添加成功' : action === 'edit' ? '用户组更新成功' : '用户组删除成功', showAlert);
      } catch (err) {
        showError(err instanceof Error ? err.message : '操作失败', showAlert);
        throw err;
      }
    });
  };

  const handleAddUserGroup = () => {
    if (!newUserGroup.name.trim()) return;
    handleUserGroupAction('add', newUserGroup.name, newUserGroup.enabledApis);
  };

  const handleEditUserGroup = () => {
    if (!editingUserGroup?.name.trim()) return;
    handleUserGroupAction('edit', editingUserGroup.name, editingUserGroup.enabledApis);
  };

  const handleDeleteUserGroup = (groupName: string) => {
    // 计算会受影响的用户数量
    const affectedUsers = config?.UserConfig?.Users?.filter(user =>
      user.tags && user.tags.includes(groupName)
    ) || [];

    setDeletingUserGroup({
      name: groupName,
      affectedUsers: affectedUsers.map(u => ({ username: u.username, role: u.role }))
    });
    setShowDeleteUserGroupModal(true);
  };

  const handleConfirmDeleteUserGroup = async () => {
    if (!deletingUserGroup) return;

    try {
      await handleUserGroupAction('delete', deletingUserGroup.name);
      setShowDeleteUserGroupModal(false);
      setDeletingUserGroup(null);
    } catch (err) {
      // 错误处理已在 handleUserGroupAction 中处理
    }
  };

  const handleStartEditUserGroup = (group: { name: string; enabledApis: string[] }) => {
    setEditingUserGroup({ ...group });
    setShowEditUserGroupForm(true);
    setShowAddUserGroupForm(false);
  };

  // 为用户分配用户组
  const handleAssignUserGroup = async (username: string, userGroups: string[]) => {
    return withLoading(`assignUserGroup_${username}`, async () => {
      try {
        const res = await fetch('/api/admin/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUsername: username,
            action: 'updateUserGroups',
            userGroups,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `操作失败: ${res.status}`);
        }

        await refreshConfig();
        showSuccess('用户组分配成功', showAlert);
      } catch (err) {
        showError(err instanceof Error ? err.message : '操作失败', showAlert);
        throw err;
      }
    });
  };

  const handleBanUser = async (uname: string) => {
    await withLoading(`banUser_${uname}`, () => handleUserAction('ban', uname));
  };

  const handleUnbanUser = async (uname: string) => {
    await withLoading(`unbanUser_${uname}`, () => handleUserAction('unban', uname));
  };

  const handleSetAdmin = async (uname: string) => {
    await withLoading(`setAdmin_${uname}`, () => handleUserAction('setAdmin', uname));
  };

  const handleRemoveAdmin = async (uname: string) => {
    await withLoading(`removeAdmin_${uname}`, () => handleUserAction('cancelAdmin', uname));
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) return;
    await withLoading('addUser', async () => {
      await handleUserAction('add', newUser.username, newUser.password, newUser.userGroup);
      setNewUser({ username: '', password: '', userGroup: '' });
      setShowAddUserForm(false);
    });
  };

  const handleChangePassword = async () => {
    if (!changePasswordUser.username || !changePasswordUser.password) return;
    await withLoading(`changePassword_${changePasswordUser.username}`, async () => {
      await handleUserAction(
        'changePassword',
        changePasswordUser.username,
        changePasswordUser.password
      );
      setChangePasswordUser({ username: '', password: '' });
      setShowChangePasswordForm(false);
    });
  };

  const handleShowChangePasswordForm = (username: string) => {
    setChangePasswordUser({ username, password: '' });
    setShowChangePasswordForm(true);
    setShowAddUserForm(false); // 关闭添加用户表单
  };

  const handleDeleteUser = (username: string) => {
    setDeletingUser(username);
    setShowDeleteUserModal(true);
  };

  const handleConfigureUserApis = (user: {
    username: string;
    role: 'user' | 'admin' | 'owner';
    enabledApis?: string[];
  }) => {
    setSelectedUser(user);
    setSelectedApis(user.enabledApis || []);
    setShowConfigureApisModal(true);
  };

  const handleConfigureUserGroup = (user: {
    username: string;
    role: 'user' | 'admin' | 'owner';
    tags?: string[];
  }) => {
    setSelectedUserForGroup(user);
    setSelectedUserGroups(user.tags || []);
    setShowConfigureUserGroupModal(true);
  };

  const handleSaveUserGroups = async () => {
    if (!selectedUserForGroup) return;

    await withLoading(`saveUserGroups_${selectedUserForGroup.username}`, async () => {
      try {
        await handleAssignUserGroup(selectedUserForGroup.username, selectedUserGroups);
        setShowConfigureUserGroupModal(false);
        setSelectedUserForGroup(null);
        setSelectedUserGroups([]);
      } catch (err) {
        // 错误处理已在 handleAssignUserGroup 中处理
      }
    });
  };

  // 处理用户选择
  const handleSelectUser = useCallback((username: string, checked: boolean) => {
    setSelectedUsers(prev => {
      const newSelectedUsers = new Set(prev);
      if (checked) {
        newSelectedUsers.add(username);
      } else {
        newSelectedUsers.delete(username);
      }
      return newSelectedUsers;
    });
  }, []);

  const handleSelectAllUsers = useCallback((checked: boolean) => {
    if (checked) {
      // 只选择自己有权限操作的用户
      const selectableUsernames = config?.UserConfig?.Users?.filter(user =>
      (role === 'owner' ||
        (role === 'admin' &&
          (user.role === 'user' ||
            user.username === currentUsername)))
      ).map(u => u.username) || [];
      setSelectedUsers(new Set(selectableUsernames));
    } else {
      setSelectedUsers(new Set());
    }
  }, [config?.UserConfig?.Users, role, currentUsername]);

  // 批量设置用户组
  const handleBatchSetUserGroup = async (userGroup: string) => {
    if (selectedUsers.size === 0) return;

    await withLoading('batchSetUserGroup', async () => {
      try {
        const res = await fetch('/api/admin/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'batchUpdateUserGroups',
            usernames: Array.from(selectedUsers),
            userGroups: userGroup === '' ? [] : [userGroup],
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `操作失败: ${res.status}`);
        }

        const userCount = selectedUsers.size;
        setSelectedUsers(new Set());
        setShowBatchUserGroupModal(false);
        setSelectedUserGroup('');
        showSuccess(`已为 ${userCount} 个用户设置用户组: ${userGroup}`, showAlert);

        // 刷新配置
        await refreshConfig();
      } catch (err) {
        showError('批量设置用户组失败', showAlert);
        throw err;
      }
    });
  };



  // 提取URL域名的辅助函数
  const extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      // 如果URL格式不正确，返回原字符串
      return url;
    }
  };

  const handleSaveUserApis = async () => {
    if (!selectedUser) return;

    await withLoading(`saveUserApis_${selectedUser.username}`, async () => {
      try {
        const res = await fetch('/api/admin/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUsername: selectedUser.username,
            action: 'updateUserApis',
            enabledApis: selectedApis,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `操作失败: ${res.status}`);
        }

        // 成功后刷新配置
        await refreshConfig();
        setShowConfigureApisModal(false);
        setSelectedUser(null);
        setSelectedApis([]);
      } catch (err) {
        showError(err instanceof Error ? err.message : '操作失败', showAlert);
        throw err;
      }
    });
  };

  // 通用请求函数
  const handleUserAction = async (
    action:
      | 'add'
      | 'ban'
      | 'unban'
      | 'setAdmin'
      | 'cancelAdmin'
      | 'changePassword'
      | 'deleteUser',
    targetUsername: string,
    targetPassword?: string,
    userGroup?: string
  ) => {
    try {
      const res = await fetch('/api/admin/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUsername,
          ...(targetPassword ? { targetPassword } : {}),
          ...(userGroup ? { userGroup } : {}),
          action,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `操作失败: ${res.status}`);
      }

      // 成功后刷新配置（无需整页刷新）
      await refreshConfig();
    } catch (err) {
      showError(err instanceof Error ? err.message : '操作失败', showAlert);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;

    await withLoading(`deleteUser_${deletingUser}`, async () => {
      try {
        await handleUserAction('deleteUser', deletingUser);
        setShowDeleteUserModal(false);
        setDeletingUser(null);
      } catch (err) {
        // 错误处理已在 handleUserAction 中处理
      }
    });
  };

  if (!config) {
    return (
      <div className='text-center text-gray-500 dark:text-gray-400'>
        加载中...
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 用户统计 */}
      <div>
        <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>
          用户统计
        </h4>
        <div className='p-4 bg-accent/10 rounded-lg border border-accent/20'>
          <div className='text-2xl font-bold text-accent'>
            {config.UserConfig.Users.length}
          </div>
          <div className='text-sm text-accent'>
            总用户数
          </div>
        </div>
      </div>



      {/* 用户组管理 */}
      <div>
        <div className='flex items-center justify-between mb-3'>
          <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            用户组管理
          </h4>
          <Button
            size='sm'
            variant={showAddUserGroupForm ? 'secondary' : 'primary'}
            onPress={() => {
              setShowAddUserGroupForm(!showAddUserGroupForm);
              if (showEditUserGroupForm) {
                setShowEditUserGroupForm(false);
                setEditingUserGroup(null);
              }
            }}
          >
            {showAddUserGroupForm ? '取消' : '添加用户组'}
          </Button>
        </div>

        {/* 用户组列表 */}
        <AdminTable ariaLabel='用户组列表'>
          <Table.Header>
            <Table.Column isRowHeader>用户组名称</Table.Column>
            <Table.Column>可用视频源</Table.Column>
            <Table.Column className='text-right'>操作</Table.Column>
          </Table.Header>
          <Table.Body>
              {userGroups.map((group) => (
                <Table.Row key={group.name} id={group.name}>
                  <Table.Cell className='font-medium'>
                    {group.name}
                  </Table.Cell>
                  <Table.Cell>
                    {group.enabledApis && group.enabledApis.length > 0
                      ? `${group.enabledApis.length} 个源`
                      : '无限制'}
                  </Table.Cell>
                  <Table.Cell>
                    <div className='flex justify-end gap-2'>
                    <Button
                      size='sm'
                      variant='secondary'
                      onPress={() => handleStartEditUserGroup(group)}
                      isDisabled={isLoading(`userGroup_edit_${group.name}`)}
                    >
                      编辑
                    </Button>
                    <Button
                      size='sm'
                      variant='danger-soft'
                      onPress={() => handleDeleteUserGroup(group.name)}
                    >
                      删除
                    </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
              {userGroups.length === 0 && (
                <Table.Row id='empty-user-groups'>
                  <Table.Cell colSpan={3} className='py-8 text-center text-muted'>
                    暂无用户组，请添加用户组来管理用户权限
                  </Table.Cell>
                </Table.Row>
              )}
          </Table.Body>
        </AdminTable>
      </div>

      {/* 用户列表 */}
      <div>
        <div className='flex items-center justify-between mb-3'>
          <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            用户列表
          </h4>
          <div className='flex items-center space-x-2'>
            {/* 批量操作按钮 */}
            {selectedUsers.size > 0 && (
              <>
                <div className='flex items-center space-x-3'>
                  <span className='text-sm text-gray-600 dark:text-gray-400'>
                    已选择 {selectedUsers.size} 个用户
                  </span>
                  <Button
                    size='sm'
                    variant='primary'
                    onPress={() => setShowBatchUserGroupModal(true)}
                  >
                    批量设置用户组
                  </Button>
                </div>
                <div className='w-px h-6 bg-gray-300 dark:bg-gray-600'></div>
              </>
            )}
            <Button
              size='sm'
              variant={showAddUserForm ? 'secondary' : 'primary'}
              onPress={() => {
                setShowAddUserForm(!showAddUserForm);
                if (showChangePasswordForm) {
                  setShowChangePasswordForm(false);
                  setChangePasswordUser({ username: '', password: '' });
                }
              }}
            >
              {showAddUserForm ? '取消' : '添加用户'}
            </Button>
          </div>
        </div>

        {/* 添加用户表单 */}
        {showAddUserForm && (
          <Card variant='secondary' className='mb-4 p-4'>
            <div className='space-y-4'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <TextField fullWidth>
                  <Label>用户名</Label>
                  <Input
                    type='text'
                    placeholder='用户名'
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, username: e.target.value }))
                    }
                  />
                </TextField>
                <TextField fullWidth>
                  <Label>密码</Label>
                  <Input
                    type='password'
                    placeholder='密码'
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, password: e.target.value }))
                    }
                  />
                </TextField>
              </div>
              <AppFilterSelect
                label='用户组（可选）'
                value={newUser.userGroup}
                placeholder='无用户组（无限制）'
                options={[
                  { label: '无用户组（无限制）', value: '' },
                  ...userGroups.map((group) => ({
                    label: `${group.name} (${group.enabledApis && group.enabledApis.length > 0 ? `${group.enabledApis.length} 个源` : '无限制'})`,
                    value: group.name,
                  })),
                ]}
                onChange={(value) =>
                  setNewUser((prev) => ({ ...prev, userGroup: value }))
                }
              />
              <div className='flex justify-end'>
                <Button
                  variant='primary'
                  onPress={handleAddUser}
                  isDisabled={!newUser.username || !newUser.password || isLoading('addUser')}
                >
                  {isLoading('addUser') ? '添加中...' : '添加'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* 修改密码表单 */}
        {showChangePasswordForm && (
          <div className='mb-4 p-4 bg-accent/10 rounded-lg border border-accent/20'>
            <h5 className='text-sm font-medium text-accent mb-3'>
              修改用户密码
            </h5>
            <div className='flex flex-col sm:flex-row gap-4 sm:gap-3'>
              <TextField className='flex-1'>
                <Label>用户名</Label>
                <Input
                  type='text'
                  placeholder='用户名'
                  value={changePasswordUser.username}
                  disabled
                />
              </TextField>
              <TextField className='flex-1'>
                <Label>新密码</Label>
                <Input
                  type='password'
                  placeholder='新密码'
                  value={changePasswordUser.password}
                  onChange={(e) =>
                    setChangePasswordUser((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                />
              </TextField>
              <Button
                className='w-full sm:w-auto'
                variant='primary'
                onPress={handleChangePassword}
                isDisabled={!changePasswordUser.password || isLoading(`changePassword_${changePasswordUser.username}`)}
              >
                {isLoading(`changePassword_${changePasswordUser.username}`) ? '修改中...' : '修改密码'}
              </Button>
              <Button
                className='w-full sm:w-auto'
                variant='secondary'
                onPress={() => {
                  setShowChangePasswordForm(false);
                  setChangePasswordUser({ username: '', password: '' });
                }}
              >
                取消
              </Button>
            </div>
          </div>
        )}

        {/* 用户列表 */}
        <AdminTable ariaLabel='用户列表' minWidth='min-w-[1200px]'>
          <Table.Header>
                <Table.Column className='w-4' />
                <Table.Column className='w-10 text-center'>
                  {(() => {
                    // 检查是否有权限操作任何用户
                    const hasAnyPermission = config?.UserConfig?.Users?.some(user =>
                    (role === 'owner' ||
                      (role === 'admin' &&
                        (user.role === 'user' ||
                          user.username === currentUsername)))
                    );

                    return hasAnyPermission ? (
                      <AdminCheckbox
                        ariaLabel='选择全部用户'
                        isSelected={selectAllUsers}
                        onChange={handleSelectAllUsers}
                      />
                    ) : (
                      <div className='w-4 h-4' />
                    );
                  })()}
                </Table.Column>
                <Table.Column isRowHeader>
                  用户名
                </Table.Column>
                <Table.Column>
                  角色
                </Table.Column>
                <Table.Column>
                  状态
                </Table.Column>
                <Table.Column>
                  用户组
                </Table.Column>
                <Table.Column>
                  采集源权限
                </Table.Column>
                <Table.Column>
                  机器码
                </Table.Column>
                <Table.Column className='text-right'>
                  操作
                </Table.Column>
          </Table.Header>
            {/* 按规则排序用户：自己 -> 站长(若非自己) -> 管理员 -> 其他 */}
            {(() => {
              const sortedUsers = [...config.UserConfig.Users].sort((a, b) => {
                type UserInfo = (typeof config.UserConfig.Users)[number];
                const priority = (u: UserInfo) => {
                  if (u.username === currentUsername) return 0;
                  if (u.role === 'owner') return 1;
                  if (u.role === 'admin') return 2;
                  return 3;
                };
                return priority(a) - priority(b);
              });
              return (
                <Table.Body>
                  {sortedUsers.map((user) => {
                    // 修改密码权限：站长可修改管理员和普通用户密码，管理员可修改普通用户和自己的密码，但任何人都不能修改站长密码
                    const canChangePassword =
                      user.role !== 'owner' && // 不能修改站长密码
                      (role === 'owner' || // 站长可以修改管理员和普通用户密码
                        (role === 'admin' &&
                          (user.role === 'user' ||
                            user.username === currentUsername))); // 管理员可以修改普通用户和自己的密码

                    // 删除用户权限：站长可删除除自己外的所有用户，管理员仅可删除普通用户
                    const canDeleteUser =
                      user.username !== currentUsername &&
                      (role === 'owner' || // 站长可以删除除自己外的所有用户
                        (role === 'admin' && user.role === 'user')); // 管理员仅可删除普通用户

                    // 其他操作权限：不能操作自己，站长可操作所有用户，管理员可操作普通用户
                    const canOperate =
                      user.username !== currentUsername &&
                      (role === 'owner' ||
                        (role === 'admin' && user.role === 'user'));
                    return (
                      <Table.Row
                        key={user.username}
                        id={user.username}
                      >
                        <Table.Cell className='w-4' />
                        <Table.Cell className='w-10 text-center'>
                          {(role === 'owner' ||
                            (role === 'admin' &&
                              (user.role === 'user' ||
                                user.username === currentUsername))) ? (
                            <AdminCheckbox
                              ariaLabel={`选择用户 ${user.username}`}
                              isSelected={selectedUsers.has(user.username)}
                              onChange={(selected) => handleSelectUser(user.username, selected)}
                            />
                          ) : (
                            <div className='w-4 h-4' />
                          )}
                        </Table.Cell>
                        <Table.Cell className='font-medium'>
                          <div className='flex items-center gap-3'>
                            <UserAvatar username={user.username} size="sm" />
                            <span>{user.username}</span>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <AdminChip color={user.role === 'owner' ? 'warning' : user.role === 'admin' ? 'accent' : 'default'}>
                            {user.role === 'owner'
                              ? '站长'
                              : user.role === 'admin'
                                ? '管理员'
                                : '普通用户'}
                          </AdminChip>
                        </Table.Cell>
                        <Table.Cell>
                          <AdminChip color={!user.banned ? 'success' : 'danger'}>
                            {!user.banned ? '正常' : '已封禁'}
                          </AdminChip>
                        </Table.Cell>
                        <Table.Cell>
                          <div className='flex items-center space-x-2'>
                            <span className='text-sm'>
                              {user.tags && user.tags.length > 0
                                ? user.tags.join(', ')
                                : '无用户组'}
                            </span>
                            {/* 配置用户组按钮 */}
                            {(role === 'owner' ||
                              (role === 'admin' &&
                                (user.role === 'user' ||
                                  user.username === currentUsername))) && (
                                <Button
                                  size='sm'
                                  variant='secondary'
                                  onPress={() => handleConfigureUserGroup(user)}
                                >
                                  配置
                                </Button>
                              )}
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <div className='flex items-center space-x-2'>
                            <span className='text-sm'>
                              {user.enabledApis && user.enabledApis.length > 0
                                ? `${user.enabledApis.length} 个源`
                                : '无限制'}
                            </span>
                            {/* 配置采集源权限按钮 */}
                            {(role === 'owner' ||
                              (role === 'admin' &&
                                (user.role === 'user' ||
                                  user.username === currentUsername))) && (
                                <Button
                                  size='sm'
                                  variant='secondary'
                                  onPress={() => handleConfigureUserApis(user)}
                                >
                                  配置
                                </Button>
                              )}
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <MachineCodeCell
                            username={user.username}
                            canManage={canOperate}
                            machineCodeData={machineCodeUsers}
                            onRefresh={fetchMachineCodeUsers}
                            showAlert={showAlert}
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <div className='flex flex-wrap justify-end gap-2'>
                          {/* 修改密码按钮 */}
                          {canChangePassword && (
                            <Button
                              size='sm'
                              variant='secondary'
                              onPress={() =>
                                handleShowChangePasswordForm(user.username)
                              }
                            >
                              修改密码
                            </Button>
                          )}
                          {canOperate && (
                            <>
                              {/* 其他操作按钮 */}
                              {user.role === 'user' && (
                                <Button
                                  size='sm'
                                  variant='secondary'
                                  onPress={() => handleSetAdmin(user.username)}
                                  isDisabled={isLoading(`setAdmin_${user.username}`)}
                                >
                                  设为管理
                                </Button>
                              )}
                              {user.role === 'admin' && (
                                <Button
                                  size='sm'
                                  variant='secondary'
                                  onPress={() =>
                                    handleRemoveAdmin(user.username)
                                  }
                                  isDisabled={isLoading(`removeAdmin_${user.username}`)}
                                >
                                  取消管理
                                </Button>
                              )}
                              {user.role !== 'owner' &&
                                (!user.banned ? (
                                  <Button
                                    size='sm'
                                    variant='danger-soft'
                                    onPress={() => handleBanUser(user.username)}
                                    isDisabled={isLoading(`banUser_${user.username}`)}
                                  >
                                    封禁
                                  </Button>
                                ) : (
                                  <Button
                                    size='sm'
                                    variant='secondary'
                                    onPress={() =>
                                      handleUnbanUser(user.username)
                                    }
                                    isDisabled={isLoading(`unbanUser_${user.username}`)}
                                  >
                                    解封
                                  </Button>
                                ))}
                            </>
                          )}
                          {/* 删除用户按钮 - 放在最后，使用更明显的红色样式 */}
                          {canDeleteUser && (
                            <Button
                              size='sm'
                              variant='danger-soft'
                              onPress={() => handleDeleteUser(user.username)}
                            >
                              删除用户
                            </Button>
                          )}
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              );
            })()}
        </AdminTable>
      </div>

      {/* 配置用户采集源权限弹窗 */}
      <AppDialog
        isOpen={showConfigureApisModal && Boolean(selectedUser)}
        onOpenChange={(open) => {
          if (!open) {
            setShowConfigureApisModal(false);
            setSelectedUser(null);
            setSelectedApis([]);
          }
        }}
        title={`配置用户采集源权限${selectedUser ? ` - ${selectedUser.username}` : ''}`}
        size='lg'
        footer={
          selectedUser ? (
            <>
              <Button
                variant='secondary'
                onPress={() => {
                  setShowConfigureApisModal(false);
                  setSelectedUser(null);
                  setSelectedApis([]);
                }}
              >
                取消
              </Button>
              <Button
                variant='primary'
                onPress={handleSaveUserApis}
                isDisabled={isLoading(`saveUserApis_${selectedUser.username}`)}
              >
                {isLoading(`saveUserApis_${selectedUser.username}`) ? '配置中...' : '确认配置'}
              </Button>
            </>
          ) : null
        }
      >
        <div className='space-y-6'>
          <Alert status='accent'>
            <Alert.Content>
              <Alert.Title>配置说明</Alert.Title>
              <Alert.Description>
                提示：全不选为无限制，选中的采集源将限制用户只能访问这些源
              </Alert.Description>
            </Alert.Content>
          </Alert>

          <section>
            <h4 className='mb-4 text-sm font-medium'>选择可用的采集源：</h4>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
              {config?.SourceConfig?.map((source) => (
                <Checkbox
                  key={source.key}
                  isSelected={selectedApis.includes(source.key)}
                  onChange={(isSelected) => {
                    if (isSelected) {
                      setSelectedApis([...selectedApis, source.key]);
                    } else {
                      setSelectedApis(selectedApis.filter(api => api !== source.key));
                    }
                  }}
                >
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Content>
                    <div className='min-w-0'>
                      <div className='truncate text-sm font-medium'>{source.name}</div>
                      {source.api ? (
                        <div className='truncate text-xs text-muted'>
                          {extractDomain(source.api)}
                        </div>
                      ) : null}
                    </div>
                  </Checkbox.Content>
                </Checkbox>
              ))}
            </div>
          </section>

          <Card variant='secondary' className='p-4'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div className='flex gap-2'>
                <Button size='sm' variant='secondary' onPress={() => setSelectedApis([])}>
                  全不选（无限制）
                </Button>
                <Button
                  size='sm'
                  variant='secondary'
                  onPress={() => {
                    const allApis = config?.SourceConfig?.filter(source => !source.disabled).map(s => s.key) || [];
                    setSelectedApis(allApis);
                  }}
                >
                  全选
                </Button>
              </div>
              <div className='text-sm text-muted'>
                已选择：<span className='font-medium text-accent'>
                  {selectedApis.length > 0 ? `${selectedApis.length} 个源` : '无限制'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </AppDialog>

      {/* 添加用户组弹窗 */}
      <AppDialog
        isOpen={showAddUserGroupForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddUserGroupForm(false);
            setNewUserGroup({ name: '', enabledApis: [] });
          }
        }}
        title='添加新用户组'
        size='lg'
        footer={
          <>
            <Button
              variant='secondary'
              onPress={() => {
                setShowAddUserGroupForm(false);
                setNewUserGroup({ name: '', enabledApis: [] });
              }}
            >
              取消
            </Button>
            <Button
              variant='primary'
              onPress={handleAddUserGroup}
              isDisabled={!newUserGroup.name.trim() || isLoading('userGroup_add_new')}
            >
              {isLoading('userGroup_add_new') ? '添加中...' : '添加用户组'}
            </Button>
          </>
        }
      >
        <div className='space-y-6'>
          <TextField>
            <Label>用户组名称</Label>
            <Input
              type='text'
              placeholder='请输入用户组名称'
              value={newUserGroup.name}
              onChange={(e) =>
                setNewUserGroup((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </TextField>

          <section>
            <Label>可用视频源</Label>
            <div className='mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
              {config?.SourceConfig?.map((source) => (
                <Checkbox
                  key={source.key}
                  isSelected={newUserGroup.enabledApis.includes(source.key)}
                  onChange={(isSelected) => {
                    if (isSelected) {
                      setNewUserGroup(prev => ({
                        ...prev,
                        enabledApis: [...prev.enabledApis, source.key]
                      }));
                    } else {
                      setNewUserGroup(prev => ({
                        ...prev,
                        enabledApis: prev.enabledApis.filter(api => api !== source.key)
                      }));
                    }
                  }}
                >
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Content>
                    <div className='min-w-0'>
                      <div className='truncate text-sm font-medium'>{source.name}</div>
                      {source.api ? (
                        <div className='truncate text-xs text-muted'>
                          {extractDomain(source.api)}
                        </div>
                      ) : null}
                    </div>
                  </Checkbox.Content>
                </Checkbox>
              ))}
            </div>

            <div className='mt-4 flex gap-2'>
              <Button
                size='sm'
                variant='secondary'
                onPress={() => setNewUserGroup(prev => ({ ...prev, enabledApis: [] }))}
              >
                全不选（无限制）
              </Button>
              <Button
                size='sm'
                variant='secondary'
                onPress={() => {
                  const allApis = config?.SourceConfig?.filter(source => !source.disabled).map(s => s.key) || [];
                  setNewUserGroup(prev => ({ ...prev, enabledApis: allApis }));
                }}
              >
                全选
              </Button>
            </div>
          </section>
        </div>
      </AppDialog>

      {/* 编辑用户组弹窗 */}
      <AppDialog
        isOpen={showEditUserGroupForm && Boolean(editingUserGroup)}
        onOpenChange={(open) => {
          if (!open) {
            setShowEditUserGroupForm(false);
            setEditingUserGroup(null);
          }
        }}
        title={`编辑用户组${editingUserGroup ? ` - ${editingUserGroup.name}` : ''}`}
        size='lg'
        footer={
          editingUserGroup ? (
            <>
              <Button
                variant='secondary'
                onPress={() => {
                  setShowEditUserGroupForm(false);
                  setEditingUserGroup(null);
                }}
              >
                取消
              </Button>
              <Button
                variant='primary'
                onPress={handleEditUserGroup}
                isDisabled={isLoading(`userGroup_edit_${editingUserGroup.name}`)}
              >
                {isLoading(`userGroup_edit_${editingUserGroup.name}`) ? '保存中...' : '保存修改'}
              </Button>
            </>
          ) : null
        }
      >
        {editingUserGroup ? (
          <section>
            <Label>可用视频源</Label>
            <div className='mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
              {config?.SourceConfig?.map((source) => (
                <Checkbox
                  key={source.key}
                  isSelected={editingUserGroup.enabledApis.includes(source.key)}
                  onChange={(isSelected) => {
                    if (isSelected) {
                      setEditingUserGroup(prev => prev ? {
                        ...prev,
                        enabledApis: [...prev.enabledApis, source.key]
                      } : null);
                    } else {
                      setEditingUserGroup(prev => prev ? {
                        ...prev,
                        enabledApis: prev.enabledApis.filter(api => api !== source.key)
                      } : null);
                    }
                  }}
                >
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Content>
                    <div className='min-w-0'>
                      <div className='truncate text-sm font-medium'>{source.name}</div>
                      {source.api ? (
                        <div className='truncate text-xs text-muted'>
                          {extractDomain(source.api)}
                        </div>
                      ) : null}
                    </div>
                  </Checkbox.Content>
                </Checkbox>
              ))}
            </div>

            <div className='mt-4 flex gap-2'>
              <Button
                size='sm'
                variant='secondary'
                onPress={() => setEditingUserGroup(prev => prev ? { ...prev, enabledApis: [] } : null)}
              >
                全不选（无限制）
              </Button>
              <Button
                size='sm'
                variant='secondary'
                onPress={() => {
                  const allApis = config?.SourceConfig?.filter(source => !source.disabled).map(s => s.key) || [];
                  setEditingUserGroup(prev => prev ? { ...prev, enabledApis: allApis } : null);
                }}
              >
                全选
              </Button>
            </div>
          </section>
        ) : null}
      </AppDialog>

      {/* 配置用户组弹窗 */}
      <AppDialog
        isOpen={showConfigureUserGroupModal && Boolean(selectedUserForGroup)}
        onOpenChange={(open) => {
          if (!open) {
            setShowConfigureUserGroupModal(false);
            setSelectedUserForGroup(null);
            setSelectedUserGroups([]);
          }
        }}
        title={`配置用户组${selectedUserForGroup ? ` - ${selectedUserForGroup.username}` : ''}`}
        size='lg'
        footer={
          selectedUserForGroup ? (
            <>
              <Button
                variant='secondary'
                onPress={() => {
                  setShowConfigureUserGroupModal(false);
                  setSelectedUserForGroup(null);
                  setSelectedUserGroups([]);
                }}
              >
                取消
              </Button>
              <Button
                variant='primary'
                onPress={handleSaveUserGroups}
                isDisabled={isLoading(`saveUserGroups_${selectedUserForGroup.username}`)}
              >
                {isLoading(`saveUserGroups_${selectedUserForGroup.username}`) ? '配置中...' : '确认配置'}
              </Button>
            </>
          ) : null
        }
      >
        <div className='space-y-6'>
          <Alert status='accent'>
            <Alert.Content>
              <Alert.Title>配置说明</Alert.Title>
              <Alert.Description>
                提示：选择"无用户组"为无限制，选择特定用户组将限制用户只能访问该用户组允许的采集源
              </Alert.Description>
            </Alert.Content>
          </Alert>
          <AppFilterSelect
            label='选择用户组'
            value={selectedUserGroups.length > 0 ? selectedUserGroups[0] : ''}
            options={[
              { value: '', label: '无用户组（无限制）' },
              ...userGroups.map((group) => ({
                value: group.name,
                label: `${group.name} ${group.enabledApis && group.enabledApis.length > 0 ? `(${group.enabledApis.length} 个源)` : ''}`,
              })),
            ]}
            onChange={(value) => setSelectedUserGroups(value ? [value] : [])}
          />
          <p className='text-xs text-muted'>
            选择"无用户组"为无限制，选择特定用户组将限制用户只能访问该用户组允许的采集源
          </p>
        </div>
      </AppDialog>

      {/* 删除用户组确认弹窗 */}
      <AppDialog
        isOpen={showDeleteUserGroupModal && Boolean(deletingUserGroup)}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteUserGroupModal(false);
            setDeletingUserGroup(null);
          }
        }}
        title='确认删除用户组'
        footer={
          deletingUserGroup ? (
            <>
              <Button
                variant='secondary'
                onPress={() => {
                  setShowDeleteUserGroupModal(false);
                  setDeletingUserGroup(null);
                }}
              >
                取消
              </Button>
              <Button
                variant='primary'
                onPress={handleConfirmDeleteUserGroup}
                isDisabled={isLoading(`userGroup_delete_${deletingUserGroup.name}`)}
              >
                {isLoading(`userGroup_delete_${deletingUserGroup.name}`) ? '删除中...' : '确认删除'}
              </Button>
            </>
          ) : null
        }
      >
        {deletingUserGroup ? (
          <div className='space-y-4'>
            <Alert status='danger'>
              <Alert.Content>
                <Alert.Title>危险操作警告</Alert.Title>
                <Alert.Description>
                  删除用户组 <strong>{deletingUserGroup.name}</strong> 将影响所有使用该组的用户，此操作不可恢复！
                </Alert.Description>
              </Alert.Content>
            </Alert>
            {deletingUserGroup.affectedUsers.length > 0 ? (
              <Alert status='warning'>
                <Alert.Content>
                  <Alert.Title>
                    将影响 {deletingUserGroup.affectedUsers.length} 个用户
                  </Alert.Title>
                  <Alert.Description>
                    <div className='space-y-1'>
                      {deletingUserGroup.affectedUsers.map((user, index) => (
                        <div key={index}>
                          • {user.username} ({user.role})
                        </div>
                      ))}
                    </div>
                    <p className='mt-2 text-xs'>这些用户的用户组将被自动移除</p>
                  </Alert.Description>
                </Alert.Content>
              </Alert>
            ) : (
              <Alert status='success'>
                当前没有用户使用此用户组
              </Alert>
            )}
          </div>
        ) : null}
      </AppDialog>

      {/* 删除用户确认弹窗 */}
      <AppDialog
        isOpen={showDeleteUserModal && Boolean(deletingUser)}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteUserModal(false);
            setDeletingUser(null);
          }
        }}
        title='确认删除用户'
        footer={
          <>
            <Button
              variant='secondary'
              onPress={() => {
                setShowDeleteUserModal(false);
                setDeletingUser(null);
              }}
            >
              取消
            </Button>
            <Button variant='primary' onPress={handleConfirmDeleteUser}>
              确认删除
            </Button>
          </>
        }
      >
        <Alert status='danger'>
          <Alert.Content>
            <Alert.Title>危险操作警告</Alert.Title>
            <Alert.Description>
              删除用户 <strong>{deletingUser}</strong> 将同时删除其搜索历史、播放记录和收藏夹，此操作不可恢复！
            </Alert.Description>
          </Alert.Content>
        </Alert>
      </AppDialog>

      {/* 批量设置用户组弹窗 */}
      <AppDialog
        isOpen={showBatchUserGroupModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowBatchUserGroupModal(false);
            setSelectedUserGroup('');
          }
        }}
        title='批量设置用户组'
        footer={
          <>
            <Button
              variant='secondary'
              onPress={() => {
                setShowBatchUserGroupModal(false);
                setSelectedUserGroup('');
              }}
            >
              取消
            </Button>
            <Button
              variant='primary'
              onPress={() => handleBatchSetUserGroup(selectedUserGroup)}
              isDisabled={isLoading('batchSetUserGroup')}
            >
              {isLoading('batchSetUserGroup') ? '设置中...' : '确认设置'}
            </Button>
          </>
        }
      >
        <div className='space-y-6'>
          <Alert status='accent'>
            <Alert.Content>
              <Alert.Title>批量操作说明</Alert.Title>
              <Alert.Description>
                将为选中的 <strong>{selectedUsers.size} 个用户</strong> 设置用户组，选择"无用户组"为无限制
              </Alert.Description>
            </Alert.Content>
          </Alert>
          <AppFilterSelect
            label='选择用户组'
            value={selectedUserGroup}
            options={[
              { value: '', label: '无用户组（无限制）' },
              ...userGroups.map((group) => ({
                value: group.name,
                label: `${group.name} ${group.enabledApis && group.enabledApis.length > 0 ? `(${group.enabledApis.length} 个源)` : ''}`,
              })),
            ]}
            onChange={setSelectedUserGroup}
          />
          <p className='text-xs text-muted'>
            选择"无用户组"为无限制，选择特定用户组将限制用户只能访问该用户组允许的采集源
          </p>
        </div>
      </AppDialog>

      {/* 通用弹窗组件 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        timer={alertModal.timer}
        showConfirm={alertModal.showConfirm}
      />


    </div>
  );
}

// 视频源配置组件
const VideoSourceConfig = ({
  config,
  refreshConfig,
}: {
  config: AdminConfig | null;
  refreshConfig: () => Promise<void>;
}) => {
  const { alertModal, showAlert, hideAlert } = useAlertModal();
  const { isLoading, withLoading } = useLoadingState();
  const [sources, setSources] = useState<DataSource[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);
  const [orderChanged, setOrderChanged] = useState(false);
  const [newSource, setNewSource] = useState<DataSource>({
    name: '',
    key: '',
    api: '',
    detail: '',
    disabled: false,
    from: 'config',
  });

  // 批量操作相关状态
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());

  // 使用 useMemo 计算全选状态，避免每次渲染都重新计算
  const selectAll = useMemo(() => {
    return selectedSources.size === sources.length && selectedSources.size > 0;
  }, [selectedSources.size, sources.length]);

  // 确认弹窗状态
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    onCancel: () => { }
  });

  // 有效性检测相关状态
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<Array<{
    key: string;
    name: string;
    status: 'valid' | 'no_results' | 'invalid' | 'validating';
    message: string;
    resultCount: number;
  }>>([]);

  // 单个视频源验证状态
  const [singleValidationResult, setSingleValidationResult] = useState<{
    status: 'valid' | 'invalid' | 'no_results' | 'validating' | null;
    message: string;
    details?: {
      responseTime?: number;
      resultCount?: number;
      error?: string;
      searchKeyword?: string;
    };
  }>({ status: null, message: '' });
  const [isSingleValidating, setIsSingleValidating] = useState(false);

  // 新增视频源验证状态
  const [newSourceValidationResult, setNewSourceValidationResult] = useState<{
    status: 'valid' | 'invalid' | 'no_results' | 'validating' | null;
    message: string;
    details?: {
      responseTime?: number;
      resultCount?: number;
      error?: string;
      searchKeyword?: string;
    };
  }>({ status: null, message: '' });
  const [isNewSourceValidating, setIsNewSourceValidating] = useState(false);

  // dnd-kit 传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 轻微位移即可触发
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // 长按 150ms 后触发，避免与滚动冲突
        tolerance: 5,
      },
    })
  );

  // 初始化
  useEffect(() => {
    if (config?.SourceConfig) {
      setSources(config.SourceConfig);
      // 进入时重置 orderChanged
      setOrderChanged(false);
      // 重置选择状态
      setSelectedSources(new Set());
    }
  }, [config]);

  // 通用 API 请求
  const callSourceApi = async (body: Record<string, any>) => {
    try {
      const resp = await fetch('/api/admin/source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `操作失败: ${resp.status}`);
      }

      // 成功后刷新配置
      await refreshConfig();
    } catch (err) {
      showError(err instanceof Error ? err.message : '操作失败', showAlert);
      throw err; // 向上抛出方便调用处判断
    }
  };

  const handleToggleEnable = (key: string) => {
    const target = sources.find((s) => s.key === key);
    if (!target) return;
    const action = target.disabled ? 'enable' : 'disable';
    withLoading(`toggleSource_${key}`, () => callSourceApi({ action, key })).catch(() => {
      console.error('操作失败', action, key);
    });
  };

  const handleDelete = (key: string) => {
    withLoading(`deleteSource_${key}`, () => callSourceApi({ action: 'delete', key })).catch(() => {
      console.error('操作失败', 'delete', key);
    });
  };

  const handleAddSource = () => {
    if (!newSource.name || !newSource.key || !newSource.api) return;
    withLoading('addSource', async () => {
      await callSourceApi({
        action: 'add',
        key: newSource.key,
        name: newSource.name,
        api: newSource.api,
        detail: newSource.detail,
      });
      setNewSource({
        name: '',
        key: '',
        api: '',
        detail: '',
        disabled: false,
        from: 'custom',
      });
      setShowAddForm(false);
      // 清除检测结果
      clearNewSourceValidation();
    }).catch(() => {
      console.error('操作失败', 'add', newSource);
    });
  };

  const handleEditSource = () => {
    if (!editingSource || !editingSource.name || !editingSource.api) return;
    withLoading('editSource', async () => {
      await callSourceApi({
        action: 'edit',
        key: editingSource.key,
        name: editingSource.name,
        api: editingSource.api,
        detail: editingSource.detail,
      });
      setEditingSource(null);
    }).catch(() => {
      console.error('操作失败', 'edit', editingSource);
    });
  };

  const handleCancelEdit = () => {
    setEditingSource(null);
    // 清除单个源的检测结果
    setSingleValidationResult({ status: null, message: '' });
    setIsSingleValidating(false);
  };

  // 清除新增视频源检测结果
  const clearNewSourceValidation = () => {
    setNewSourceValidationResult({ status: null, message: '' });
    setIsNewSourceValidating(false);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sources.findIndex((s) => s.key === active.id);
    const newIndex = sources.findIndex((s) => s.key === over.id);
    setSources((prev) => arrayMove(prev, oldIndex, newIndex));
    setOrderChanged(true);
  };

  const handleSaveOrder = () => {
    const order = sources.map((s) => s.key);
    withLoading('saveSourceOrder', () => callSourceApi({ action: 'sort', order }))
      .then(() => {
        setOrderChanged(false);
      })
      .catch(() => {
        console.error('操作失败', 'sort', order);
      });
  };

  // 有效性检测函数
  const handleValidateSources = async () => {
    if (!searchKeyword.trim()) {
      showAlert({ type: 'warning', title: '请输入搜索关键词', message: '搜索关键词不能为空', showConfirm: true });
      return;
    }

    await withLoading('validateSources', async () => {
      setIsValidating(true);
      setValidationResults([]); // 清空之前的结果
      setShowValidationModal(false); // 立即关闭弹窗

      // 初始化所有视频源为检测中状态
      const initialResults = sources.map(source => ({
        key: source.key,
        name: source.name,
        status: 'validating' as const,
        message: '检测中...',
        resultCount: 0
      }));
      setValidationResults(initialResults);

      try {
        // 使用EventSource接收流式数据
        const eventSource = new EventSource(`/api/admin/source/validate?q=${encodeURIComponent(searchKeyword.trim())}`);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case 'start':
                console.log(`开始检测 ${data.totalSources} 个视频源`);
                break;

              case 'source_result':
              case 'source_error':
                // 更新验证结果
                setValidationResults(prev => {
                  const existing = prev.find(r => r.key === data.source);
                  if (existing) {
                    return prev.map(r => r.key === data.source ? {
                      key: data.source,
                      name: sources.find(s => s.key === data.source)?.name || data.source,
                      status: data.status,
                      message: data.status === 'valid' ? '搜索正常' :
                        data.status === 'no_results' ? '无法搜索到结果' : '连接失败',
                      resultCount: data.status === 'valid' ? 1 : 0
                    } : r);
                  } else {
                    return [...prev, {
                      key: data.source,
                      name: sources.find(s => s.key === data.source)?.name || data.source,
                      status: data.status,
                      message: data.status === 'valid' ? '搜索正常' :
                        data.status === 'no_results' ? '无法搜索到结果' : '连接失败',
                      resultCount: data.status === 'valid' ? 1 : 0
                    }];
                  }
                });
                break;

              case 'complete':
                console.log(`检测完成，共检测 ${data.completedSources} 个视频源`);
                eventSource.close();
                setIsValidating(false);
                break;
            }
          } catch (error) {
            console.error('解析EventSource数据失败:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('EventSource错误:', error);
          eventSource.close();
          setIsValidating(false);
          showAlert({ type: 'error', title: '验证失败', message: '连接错误，请重试', showConfirm: true });
        };

        // 设置超时，防止长时间等待
        setTimeout(() => {
          if (eventSource.readyState === EventSource.OPEN) {
            eventSource.close();
            setIsValidating(false);
            showAlert({ type: 'warning', title: '验证超时', message: '检测超时，请重试', showConfirm: true });
          }
        }, 60000); // 60秒超时

      } catch (error) {
        setIsValidating(false);
        showAlert({ type: 'error', title: '验证失败', message: error instanceof Error ? error.message : '未知错误', showConfirm: true });
        throw error;
      }
    });
  };

  // 通用视频源有效性检测函数
  const handleValidateSource = async (
    api: string,
    name: string,
    isNewSource: boolean = false
  ) => {
    if (!api.trim()) {
      showAlert({ type: 'warning', title: 'API地址不能为空', message: '请输入有效的API地址', showConfirm: true });
      return;
    }

    const validationKey = isNewSource ? 'validateNewSource' : 'validateSingleSource';
    const setValidating = isNewSource ? setIsNewSourceValidating : setIsSingleValidating;
    const setResult = isNewSource ? setNewSourceValidationResult : setSingleValidationResult;

    await withLoading(validationKey, async () => {
      setValidating(true);
      setResult({ status: 'validating', message: '检测中...' });

      const startTime = Date.now();
      const testKeyword = '灵笼';

      try {
        // 构建检测 URL，使用临时 API 地址
        const eventSource = new EventSource(`/api/admin/source/validate?q=${encodeURIComponent(testKeyword)}&tempApi=${encodeURIComponent(api.trim())}&tempName=${encodeURIComponent(name)}`);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const responseTime = Date.now() - startTime;

            switch (data.type) {
              case 'start':
                console.log(`开始检测视频源: ${name}`);
                break;

              case 'source_result':
              case 'source_error':
                if (data.source === 'temp') {
                  let message = '';
                  let details: any = {
                    responseTime,
                    searchKeyword: testKeyword
                  };

                  if (data.status === 'valid') {
                    message = '搜索正常';
                    details.resultCount = data.resultCount || 0;
                  } else if (data.status === 'no_results') {
                    message = '无法搜索到结果';
                    details.resultCount = 0;
                  } else {
                    message = '连接失败';
                    details.error = data.error || '未知错误';
                  }

                  setResult({
                    status: data.status,
                    message,
                    details
                  });
                }
                break;

              case 'complete':
                console.log(`检测完成: ${name}`);
                eventSource.close();
                setValidating(false);
                break;
            }
          } catch (error) {
            console.error('解析EventSource数据失败:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('EventSource错误:', error);
          eventSource.close();
          setValidating(false);
          const responseTime = Date.now() - startTime;
          setResult({
            status: 'invalid',
            message: '连接错误，请重试',
            details: {
              responseTime,
              error: '网络连接失败',
              searchKeyword: testKeyword
            }
          });
        };

        // 设置超时，防止长时间等待
        setTimeout(() => {
          if (eventSource.readyState === EventSource.OPEN) {
            eventSource.close();
            setValidating(false);
            const responseTime = Date.now() - startTime;
            setResult({
              status: 'invalid',
              message: '检测超时，请重试',
              details: {
                responseTime,
                error: '请求超时（30秒）',
                searchKeyword: testKeyword
              }
            });
          }
        }, 30000); // 30秒超时

      } catch (error) {
        setValidating(false);
        const responseTime = Date.now() - startTime;
        setResult({
          status: 'invalid',
          message: error instanceof Error ? error.message : '未知错误',
          details: {
            responseTime,
            error: error instanceof Error ? error.message : '未知错误',
            searchKeyword: testKeyword
          }
        });
      }
    });
  };

  // 单个视频源有效性检测函数
  const handleValidateSingleSource = async () => {
    if (!editingSource) {
      showAlert({ type: 'warning', title: '没有可检测的视频源', message: '请确保正在编辑视频源', showConfirm: true });
      return;
    }
    await handleValidateSource(editingSource.api, editingSource.name, false);
  };

  // 新增视频源有效性检测函数
  const handleValidateNewSource = async () => {
    if (!newSource.name.trim()) {
      showAlert({ type: 'warning', title: '视频源名称不能为空', message: '请输入视频源名称', showConfirm: true });
      return;
    }
    await handleValidateSource(newSource.api, newSource.name, true);
  };

  // 获取有效性状态显示
  const getValidationStatus = (sourceKey: string) => {
    const result = validationResults.find(r => r.key === sourceKey);
    if (!result) return null;

    switch (result.status) {
      case 'validating':
        return {
          text: '检测中',
          className: 'bg-accent/10 text-accent',
          icon: '⟳',
          message: result.message
        };
      case 'valid':
        return {
          text: '有效',
          className: 'bg-accent/10 text-accent',
          icon: '✓',
          message: result.message
        };
      case 'no_results':
        return {
          text: '无法搜索',
          className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300',
          icon: '⚠',
          message: result.message
        };
      case 'invalid':
        return {
          text: '无效',
          className: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300',
          icon: '✗',
          message: result.message
        };
      default:
        return null;
    }
  };

  // 可拖拽行封装 (dnd-kit)
  const DraggableRow = ({ source }: { source: DataSource }) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: source.key });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    } as React.CSSProperties;

    return (
      <Table.Row
        ref={setNodeRef}
        style={style}
        id={source.key}
        className='select-none'
      >
        <Table.Cell
          className='cursor-grab text-muted'
          style={{ touchAction: 'none' }}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </Table.Cell>
        <Table.Cell className='text-center'>
          <AdminCheckbox
            ariaLabel={`选择视频源 ${source.name}`}
            isSelected={selectedSources.has(source.key)}
            onChange={(selected) => handleSelectSource(source.key, selected)}
          />
        </Table.Cell>
        <Table.Cell>
          {source.name}
        </Table.Cell>
        <Table.Cell>
          {source.key}
        </Table.Cell>
        <Table.Cell className='max-w-[12rem]'>
          <span className='block truncate' title={source.api}>
            {source.api}
          </span>
        </Table.Cell>
        <Table.Cell className='max-w-[8rem]'>
          <span className='block truncate' title={source.detail || '-'}>
            {source.detail || '-'}
          </span>
        </Table.Cell>
        <Table.Cell>
          <AdminChip color={!source.disabled ? 'success' : 'danger'}>
            {!source.disabled ? '启用中' : '已禁用'}
          </AdminChip>
        </Table.Cell>
        <Table.Cell>
          {(() => {
            const status = getValidationStatus(source.key);
            if (!status) {
              return (
                <AdminChip>未检测</AdminChip>
              );
            }
            return (
              <AdminChip color={status.text === '无效' ? 'danger' : status.text === '无法搜索' ? 'warning' : 'success'}>
                {status.icon} {status.text}
              </AdminChip>
            );
          })()}
        </Table.Cell>
        <Table.Cell>
          <div className='flex justify-end gap-2'>
          <Button
            size='sm'
            variant={!source.disabled ? 'danger-soft' : 'secondary'}
            onPress={() => handleToggleEnable(source.key)}
            isDisabled={isLoading(`toggleSource_${source.key}`)}
          >
            {!source.disabled ? '禁用' : '启用'}
          </Button>
          <Button
            size='sm'
            variant='secondary'
            onPress={() => {
              setEditingSource(source);
              // 清除之前的检测结果
              setSingleValidationResult({ status: null, message: '' });
              setIsSingleValidating(false);
            }}
            isDisabled={isLoading(`editSource_${source.key}`)}
          >
            编辑
          </Button>
          <Button
            size='sm'
            variant='danger-soft'
            onPress={() => handleDelete(source.key)}
            isDisabled={isLoading(`deleteSource_${source.key}`)}
          >
            删除
          </Button>
          </div>
        </Table.Cell>
      </Table.Row>
    );
  };

  // 全选/取消全选
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allKeys = sources.map(s => s.key);
      setSelectedSources(new Set(allKeys));
    } else {
      setSelectedSources(new Set());
    }
  }, [sources]);

  // 单个选择
  const handleSelectSource = useCallback((key: string, checked: boolean) => {
    setSelectedSources(prev => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(key);
      } else {
        newSelected.delete(key);
      }
      return newSelected;
    });
  }, []);

  // 批量操作
  const handleBatchOperation = async (action: 'batch_enable' | 'batch_disable' | 'batch_delete') => {
    if (selectedSources.size === 0) {
      showAlert({ type: 'warning', title: '请先选择要操作的视频源', message: '请选择至少一个视频源', showConfirm: true });
      return;
    }

    const keys = Array.from(selectedSources);
    let confirmMessage = '';
    let actionName = '';

    switch (action) {
      case 'batch_enable':
        confirmMessage = `确定要启用选中的 ${keys.length} 个视频源吗？`;
        actionName = '批量启用';
        break;
      case 'batch_disable':
        confirmMessage = `确定要禁用选中的 ${keys.length} 个视频源吗？`;
        actionName = '批量禁用';
        break;
      case 'batch_delete':
        confirmMessage = `确定要删除选中的 ${keys.length} 个视频源吗？此操作不可恢复！`;
        actionName = '批量删除';
        break;
    }

    // 显示确认弹窗
    setConfirmModal({
      isOpen: true,
      title: '确认操作',
      message: confirmMessage,
      onConfirm: async () => {
        try {
          await withLoading(`batchSource_${action}`, () => callSourceApi({ action, keys }));
          showAlert({ type: 'success', title: `${actionName}成功`, message: `${actionName}了 ${keys.length} 个视频源`, timer: 2000 });
          // 重置选择状态
          setSelectedSources(new Set());
        } catch (err) {
          showAlert({ type: 'error', title: `${actionName}失败`, message: err instanceof Error ? err.message : '操作失败', showConfirm: true });
        }
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => { }, onCancel: () => { } });
      },
      onCancel: () => {
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => { }, onCancel: () => { } });
      }
    });
  };

  if (!config) {
    return (
      <div className='text-center text-gray-500 dark:text-gray-400'>
        加载中...
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 添加视频源表单 */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
          视频源列表
        </h4>
        <div className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2'>
          {/* 批量操作按钮 - 移动端显示在下一行，PC端显示在左侧 */}
          {selectedSources.size > 0 && (
            <>
              <div className='flex flex-wrap items-center gap-3 order-2 sm:order-1'>
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  <span className='sm:hidden'>已选 {selectedSources.size}</span>
                  <span className='hidden sm:inline'>已选择 {selectedSources.size} 个视频源</span>
                </span>
                <Button
                  size='sm'
                  variant='primary'
                  onPress={() => handleBatchOperation('batch_enable')}
                  isDisabled={isLoading('batchSource_batch_enable')}
                >
                  {isLoading('batchSource_batch_enable') ? '启用中...' : '批量启用'}
                </Button>
                <Button
                  size='sm'
                  variant='secondary'
                  onPress={() => handleBatchOperation('batch_disable')}
                  isDisabled={isLoading('batchSource_batch_disable')}
                >
                  {isLoading('batchSource_batch_disable') ? '禁用中...' : '批量禁用'}
                </Button>
                <Button
                  size='sm'
                  variant='danger-soft'
                  onPress={() => handleBatchOperation('batch_delete')}
                  isDisabled={isLoading('batchSource_batch_delete')}
                >
                  {isLoading('batchSource_batch_delete') ? '删除中...' : '批量删除'}
                </Button>
              </div>
              <div className='hidden sm:block w-px h-6 bg-gray-300 dark:bg-gray-600 order-2'></div>
            </>
          )}
          <div className='flex items-center gap-2 order-1 sm:order-2'>
            <Button
              size='sm'
              variant='primary'
              onPress={() => setShowValidationModal(true)}
              isDisabled={isValidating}
            >
              {isValidating ? (
                <>
                  <span>检测中...</span>
                </>
              ) : (
                '有效性检测'
              )}
            </Button>
            <Button
              size='sm'
              variant={showAddForm ? 'secondary' : 'primary'}
              onPress={() => {
                setShowAddForm(!showAddForm);
                // 切换表单时清除检测结果
                if (!showAddForm) {
                  clearNewSourceValidation();
                }
              }}
            >
              {showAddForm ? '取消' : '添加视频源'}
            </Button>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className='p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <input
              type='text'
              placeholder='名称'
              value={newSource.name}
              onChange={(e) =>
                setNewSource((prev) => ({ ...prev, name: e.target.value }))
              }
              className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            />
            <input
              type='text'
              placeholder='Key'
              value={newSource.key}
              onChange={(e) =>
                setNewSource((prev) => ({ ...prev, key: e.target.value }))
              }
              className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            />
            <input
              type='text'
              placeholder='API 地址'
              value={newSource.api}
              onChange={(e) =>
                setNewSource((prev) => ({ ...prev, api: e.target.value }))
              }
              className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            />
            <input
              type='text'
              placeholder='Detail 地址（选填）'
              value={newSource.detail}
              onChange={(e) =>
                setNewSource((prev) => ({ ...prev, detail: e.target.value }))
              }
              className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            />
          </div>

          {/* 新增视频源有效性检测结果显示 */}
          {newSourceValidationResult.status && (
            <div className='p-3 rounded-lg border'>
              <div className='space-y-2'>
                <div className='flex items-center space-x-2'>
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>检测结果:</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${newSourceValidationResult.status === 'valid'
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                      : newSourceValidationResult.status === 'validating'
                        ? 'bg-accent/10 text-accent'
                        : newSourceValidationResult.status === 'no_results'
                          ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                      }`}
                  >
                    {newSourceValidationResult.status === 'valid' && '✓ '}
                    {newSourceValidationResult.status === 'validating' && '⏳ '}
                    {newSourceValidationResult.status === 'no_results' && '⚠️ '}
                    {newSourceValidationResult.status === 'invalid' && '✗ '}
                    {newSourceValidationResult.message}
                  </span>
                </div>
                {newSourceValidationResult.details && (
                  <div className='text-xs text-gray-600 dark:text-gray-400 space-y-1'>
                    {newSourceValidationResult.details.searchKeyword && (
                      <div>测试关键词: {newSourceValidationResult.details.searchKeyword}</div>
                    )}
                    {newSourceValidationResult.details.responseTime && (
                      <div>响应时间: {newSourceValidationResult.details.responseTime}ms</div>
                    )}
                    {newSourceValidationResult.details.resultCount !== undefined && (
                      <div>搜索结果数: {newSourceValidationResult.details.resultCount}</div>
                    )}
                    {newSourceValidationResult.details.error && (
                      <div className='text-red-600 dark:text-red-400'>错误信息: {newSourceValidationResult.details.error}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className='flex justify-end space-x-2'>
            <button
              onClick={handleValidateNewSource}
              disabled={!newSource.api || isNewSourceValidating || isLoading('validateNewSource')}
              className={`px-4 py-2 ${!newSource.api || isNewSourceValidating || isLoading('validateNewSource') ? buttonStyles.disabled : buttonStyles.primary}`}
            >
              {isNewSourceValidating || isLoading('validateNewSource') ? '检测中...' : '有效性检测'}
            </button>
            <button
              onClick={handleAddSource}
              disabled={!newSource.name || !newSource.key || !newSource.api || isLoading('addSource')}
              className={`px-4 py-2 ${!newSource.name || !newSource.key || !newSource.api || isLoading('addSource') ? buttonStyles.disabled : buttonStyles.success}`}
            >
              {isLoading('addSource') ? '添加中...' : '添加'}
            </button>
          </div>
        </div>
      )}

      {/* 编辑视频源表单 */}
      {editingSource && (
        <div className='p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4'>
          <div className='flex items-center justify-between'>
            <h5 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              编辑视频源: {editingSource.name}
            </h5>
            <button
              onClick={handleCancelEdit}
              className='text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            >
              ✕
            </button>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                名称
              </label>
              <input
                type='text'
                value={editingSource.name}
                onChange={(e) =>
                  setEditingSource((prev) => prev ? ({ ...prev, name: e.target.value }) : null)
                }
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Key (不可编辑)
              </label>
              <input
                type='text'
                value={editingSource.key}
                disabled
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                API 地址
              </label>
              <input
                type='text'
                value={editingSource.api}
                onChange={(e) =>
                  setEditingSource((prev) => prev ? ({ ...prev, api: e.target.value }) : null)
                }
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Detail 地址（选填）
              </label>
              <input
                type='text'
                value={editingSource.detail || ''}
                onChange={(e) =>
                  setEditingSource((prev) => prev ? ({ ...prev, detail: e.target.value }) : null)
                }
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              />
            </div>

            {/* 有效性检测结果显示 */}
            {singleValidationResult.status && (
              <div className='col-span-full mt-4 p-3 rounded-lg border'>
                <div className='space-y-2'>
                  <div className='flex items-center space-x-2'>
                    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>检测结果:</span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${singleValidationResult.status === 'valid'
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        : singleValidationResult.status === 'validating'
                          ? 'bg-accent/10 text-accent'
                          : singleValidationResult.status === 'no_results'
                            ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                            : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                        }`}
                    >
                      {singleValidationResult.status === 'valid' && '✓ '}
                      {singleValidationResult.status === 'validating' && '⏳ '}
                      {singleValidationResult.status === 'no_results' && '⚠️ '}
                      {singleValidationResult.status === 'invalid' && '✗ '}
                      {singleValidationResult.message}
                    </span>
                  </div>
                  {singleValidationResult.details && (
                    <div className='text-xs text-gray-600 dark:text-gray-400 space-y-1'>
                      {singleValidationResult.details.searchKeyword && (
                        <div>测试关键词: {singleValidationResult.details.searchKeyword}</div>
                      )}
                      {singleValidationResult.details.responseTime && (
                        <div>响应时间: {singleValidationResult.details.responseTime}ms</div>
                      )}
                      {singleValidationResult.details.resultCount !== undefined && (
                        <div>搜索结果数: {singleValidationResult.details.resultCount}</div>
                      )}
                      {singleValidationResult.details.error && (
                        <div className='text-red-600 dark:text-red-400'>错误信息: {singleValidationResult.details.error}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className='flex justify-end space-x-2'>
            <button
              onClick={handleCancelEdit}
              className={buttonStyles.secondary}
            >
              取消
            </button>
            <button
              onClick={handleValidateSingleSource}
              disabled={!editingSource.api || isSingleValidating || isLoading('validateSingleSource')}
              className={`${!editingSource.api || isSingleValidating || isLoading('validateSingleSource') ? buttonStyles.disabled : buttonStyles.primary}`}
            >
              {isSingleValidating || isLoading('validateSingleSource') ? '检测中...' : '有效性检测'}
            </button>
            <button
              onClick={handleEditSource}
              disabled={!editingSource.name || !editingSource.api || isLoading('editSource')}
              className={`${!editingSource.name || !editingSource.api || isLoading('editSource') ? buttonStyles.disabled : buttonStyles.success}`}
            >
              {isLoading('editSource') ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      )}



      {/* 视频源表格 */}
      <AdminTable ariaLabel='视频源列表' minWidth='min-w-[1100px]'>
          <Table.Header>
              <Table.Column className='w-8' />
              <Table.Column className='w-12 text-center'>
                <AdminCheckbox
                  ariaLabel='选择全部视频源'
                  isSelected={selectAll}
                  onChange={handleSelectAll}
                />
              </Table.Column>
              <Table.Column isRowHeader>
                名称
              </Table.Column>
              <Table.Column>
                Key
              </Table.Column>
              <Table.Column>
                API 地址
              </Table.Column>
              <Table.Column>
                Detail 地址
              </Table.Column>
              <Table.Column>
                状态
              </Table.Column>
              <Table.Column>
                有效性
              </Table.Column>
              <Table.Column className='text-right'>
                操作
              </Table.Column>
          </Table.Header>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            autoScroll={false}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={sources.map((s) => s.key)}
              strategy={verticalListSortingStrategy}
            >
              <Table.Body>
                {sources.map((source) => (
                  <DraggableRow key={source.key} source={source} />
                ))}
              </Table.Body>
            </SortableContext>
          </DndContext>
      </AdminTable>

      {/* 保存排序按钮 */}
      {orderChanged && (
        <div className='flex justify-end'>
          <Button
            size='sm'
            variant='primary'
            onPress={handleSaveOrder}
            isDisabled={isLoading('saveSourceOrder')}
          >
            {isLoading('saveSourceOrder') ? '保存中...' : '保存排序'}
          </Button>
        </div>
      )}

      {/* 有效性检测弹窗 */}
      <AppDialog
        isOpen={showValidationModal}
        onOpenChange={setShowValidationModal}
        title='视频源有效性检测'
        description='请输入检测用的搜索关键词'
        footer={
          <>
            <Button variant='secondary' onPress={() => setShowValidationModal(false)}>
              取消
            </Button>
            <Button
              variant='primary'
              onPress={handleValidateSources}
              isDisabled={!searchKeyword.trim()}
            >
              开始检测
            </Button>
          </>
        }
      >
        <TextField>
          <Label>搜索关键词</Label>
          <Input
            type='text'
            placeholder='请输入搜索关键词'
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleValidateSources()}
          />
        </TextField>
      </AppDialog>

      {/* 通用弹窗组件 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        timer={alertModal.timer}
        showConfirm={alertModal.showConfirm}
      />

      {/* 批量操作确认弹窗 */}
      <AppDialog
        isOpen={confirmModal.isOpen}
        onOpenChange={(open) => {
          if (!open) confirmModal.onCancel();
        }}
        title={confirmModal.title}
        description={confirmModal.message}
        footer={
          <>
            <Button variant='secondary' onPress={confirmModal.onCancel}>
              取消
            </Button>
            <Button
              variant='primary'
              onPress={confirmModal.onConfirm}
              isDisabled={isLoading('batchSource_batch_enable') || isLoading('batchSource_batch_disable') || isLoading('batchSource_batch_delete')}
            >
              {isLoading('batchSource_batch_enable') || isLoading('batchSource_batch_disable') || isLoading('batchSource_batch_delete') ? '操作中...' : '确认'}
            </Button>
          </>
        }
      />
    </div>
  );
};

// 分类配置组件
const CategoryConfig = ({
  config,
  refreshConfig,
}: {
  config: AdminConfig | null;
  refreshConfig: () => Promise<void>;
}) => {
  const { alertModal, showAlert, hideAlert } = useAlertModal();
  const { isLoading, withLoading } = useLoadingState();
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [orderChanged, setOrderChanged] = useState(false);
  const [newCategory, setNewCategory] = useState<CustomCategory>({
    name: '',
    type: 'movie',
    query: '',
    disabled: false,
    from: 'config',
  });

  // dnd-kit 传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 轻微位移即可触发
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // 长按 150ms 后触发，避免与滚动冲突
        tolerance: 5,
      },
    })
  );

  // 初始化
  useEffect(() => {
    if (config?.CustomCategories) {
      setCategories(config.CustomCategories);
      // 进入时重置 orderChanged
      setOrderChanged(false);
    }
  }, [config]);

  // 通用 API 请求
  const callCategoryApi = async (body: Record<string, any>) => {
    try {
      const resp = await fetch('/api/admin/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `操作失败: ${resp.status}`);
      }

      // 成功后刷新配置
      await refreshConfig();
    } catch (err) {
      showError(err instanceof Error ? err.message : '操作失败', showAlert);
      throw err; // 向上抛出方便调用处判断
    }
  };

  const handleToggleEnable = (query: string, type: 'movie' | 'tv') => {
    const target = categories.find((c) => c.query === query && c.type === type);
    if (!target) return;
    const action = target.disabled ? 'enable' : 'disable';
    withLoading(`toggleCategory_${query}_${type}`, () => callCategoryApi({ action, query, type })).catch(() => {
      console.error('操作失败', action, query, type);
    });
  };

  const handleDelete = (query: string, type: 'movie' | 'tv') => {
    withLoading(`deleteCategory_${query}_${type}`, () => callCategoryApi({ action: 'delete', query, type })).catch(() => {
      console.error('操作失败', 'delete', query, type);
    });
  };

  const handleAddCategory = () => {
    if (!newCategory.name || !newCategory.query) return;
    withLoading('addCategory', async () => {
      await callCategoryApi({
        action: 'add',
        name: newCategory.name,
        type: newCategory.type,
        query: newCategory.query,
      });
      setNewCategory({
        name: '',
        type: 'movie',
        query: '',
        disabled: false,
        from: 'custom',
      });
      setShowAddForm(false);
    }).catch(() => {
      console.error('操作失败', 'add', newCategory);
    });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex(
      (c) => `${c.query}:${c.type}` === active.id
    );
    const newIndex = categories.findIndex(
      (c) => `${c.query}:${c.type}` === over.id
    );
    setCategories((prev) => arrayMove(prev, oldIndex, newIndex));
    setOrderChanged(true);
  };

  const handleSaveOrder = () => {
    const order = categories.map((c) => `${c.query}:${c.type}`);
    withLoading('saveCategoryOrder', () => callCategoryApi({ action: 'sort', order }))
      .then(() => {
        setOrderChanged(false);
      })
      .catch(() => {
        console.error('操作失败', 'sort', order);
      });
  };

  // 可拖拽行封装 (dnd-kit)
  const DraggableRow = ({ category }: { category: CustomCategory }) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: `${category.query}:${category.type}` });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    } as React.CSSProperties;

    return (
      <Table.Row
        ref={setNodeRef}
        style={style}
        id={`${category.query}:${category.type}`}
        className='select-none'
      >
        <Table.Cell
          className="cursor-grab text-muted"
          style={{ touchAction: 'none' }}
          {...{ ...attributes, ...listeners }}
        >
          <GripVertical size={16} />
        </Table.Cell>
        <Table.Cell>
          {category.name || '-'}
        </Table.Cell>
        <Table.Cell>
          <AdminChip color={category.type === 'movie' ? 'accent' : 'default'}>
            {category.type === 'movie' ? '电影' : '电视剧'}
          </AdminChip>
        </Table.Cell>
        <Table.Cell className='max-w-[12rem]'>
          <span className='block truncate' title={category.query}>
            {category.query}
          </span>
        </Table.Cell>
        <Table.Cell>
          <AdminChip color={!category.disabled ? 'success' : 'danger'}>
            {!category.disabled ? '启用中' : '已禁用'}
          </AdminChip>
        </Table.Cell>
        <Table.Cell>
          <div className='flex justify-end gap-2'>
          <Button
            size='sm'
            variant={!category.disabled ? 'danger-soft' : 'secondary'}
            onPress={() =>
              handleToggleEnable(category.query, category.type)
            }
            isDisabled={isLoading(`toggleCategory_${category.query}_${category.type}`)}
          >
            {!category.disabled ? '禁用' : '启用'}
          </Button>
          {category.from !== 'config' && (
            <Button
              size='sm'
              variant='danger-soft'
              onPress={() => handleDelete(category.query, category.type)}
              isDisabled={isLoading(`deleteCategory_${category.query}_${category.type}`)}
            >
              删除
            </Button>
          )}
          </div>
        </Table.Cell>
      </Table.Row>
    );
  };

  if (!config) {
    return (
      <div className='text-center text-gray-500 dark:text-gray-400'>
        加载中...
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 添加分类表单 */}
      <div className='flex items-center justify-between'>
        <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
          自定义分类列表
        </h4>
        <Button
          size='sm'
          variant={showAddForm ? 'secondary' : 'primary'}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '取消' : '添加分类'}
        </Button>
      </div>

      {showAddForm && (
        <Card variant='secondary' className='p-4'>
        <div className='space-y-4'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <TextField fullWidth>
              <Label>分类名称</Label>
              <Input
                type='text'
                placeholder='分类名称'
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </TextField>
            <AppFilterSelect
              label='类型'
              value={newCategory.type}
              options={[
                { label: '电影', value: 'movie' },
                { label: '电视剧', value: 'tv' },
              ]}
              onChange={(value) =>
                setNewCategory((prev) => ({
                  ...prev,
                  type: value as 'movie' | 'tv',
                }))
              }
            />
            <TextField fullWidth>
              <Label>搜索关键词</Label>
              <Input
                type='text'
                placeholder='搜索关键词'
                value={newCategory.query}
                onChange={(e) =>
                  setNewCategory((prev) => ({ ...prev, query: e.target.value }))
                }
              />
            </TextField>
          </div>
          <div className='flex justify-end'>
            <Button
              className='w-full sm:w-auto'
              variant='primary'
              onPress={handleAddCategory}
              isDisabled={!newCategory.name || !newCategory.query || isLoading('addCategory')}
            >
              {isLoading('addCategory') ? '添加中...' : '添加'}
            </Button>
          </div>
        </div>
        </Card>
      )}

      {/* 分类表格 */}
      <AdminTable ariaLabel='分类列表'>
          <Table.Header>
              <Table.Column className='w-8' />
              <Table.Column isRowHeader>
                分类名称
              </Table.Column>
              <Table.Column>
                类型
              </Table.Column>
              <Table.Column>
                搜索关键词
              </Table.Column>
              <Table.Column>
                状态
              </Table.Column>
              <Table.Column className='text-right'>
                操作
              </Table.Column>
          </Table.Header>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            autoScroll={false}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={categories.map((c) => `${c.query}:${c.type}`)}
              strategy={verticalListSortingStrategy}
            >
              <Table.Body>
                {categories.map((category) => (
                  <DraggableRow
                    key={`${category.query}:${category.type}`}
                    category={category}
                  />
                ))}
              </Table.Body>
            </SortableContext>
          </DndContext>
      </AdminTable>

      {/* 保存排序按钮 */}
      {orderChanged && (
        <div className='flex justify-end'>
          <Button
            size='sm'
            variant='primary'
            onPress={handleSaveOrder}
            isDisabled={isLoading('saveCategoryOrder')}
          >
            {isLoading('saveCategoryOrder') ? '保存中...' : '保存排序'}
          </Button>
        </div>
      )}

      {/* 通用弹窗组件 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        timer={alertModal.timer}
        showConfirm={alertModal.showConfirm}
      />
    </div>
  );
};

// 新增配置文件组件
const ConfigFileComponent = ({ config, refreshConfig }: { config: AdminConfig | null; refreshConfig: () => Promise<void> }) => {
  const { alertModal, showAlert, hideAlert } = useAlertModal();
  const { isLoading, withLoading } = useLoadingState();
  const [configContent, setConfigContent] = useState('');
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');



  useEffect(() => {
    if (config?.ConfigFile) {
      setConfigContent(config.ConfigFile);
    }
    if (config?.ConfigSubscribtion) {
      setSubscriptionUrl(config.ConfigSubscribtion.URL);
      setAutoUpdate(config.ConfigSubscribtion.AutoUpdate);
      setLastCheckTime(config.ConfigSubscribtion.LastCheck || '');
    }
  }, [config]);



  // 拉取订阅配置
  const handleFetchConfig = async () => {
    if (!subscriptionUrl.trim()) {
      showError('请输入订阅URL', showAlert);
      return;
    }

    await withLoading('fetchConfig', async () => {
      try {
        const resp = await fetch('/api/admin/config_subscription/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: subscriptionUrl }),
        });

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data.error || `拉取失败: ${resp.status}`);
        }

        const data = await resp.json();
        if (data.configContent) {
          setConfigContent(data.configContent);
          // 更新本地配置的最后检查时间
          const currentTime = new Date().toISOString();
          setLastCheckTime(currentTime);
          showSuccess('配置拉取成功', showAlert);
        } else {
          showError('拉取失败：未获取到配置内容', showAlert);
        }
      } catch (err) {
        showError(err instanceof Error ? err.message : '拉取失败', showAlert);
        throw err;
      }
    });
  };

  // 保存配置文件
  const handleSave = async () => {
    await withLoading('saveConfig', async () => {
      try {
        const resp = await fetch('/api/admin/config_file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            configFile: configContent,
            subscriptionUrl,
            autoUpdate,
            lastCheckTime: lastCheckTime || new Date().toISOString()
          }),
        });

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data.error || `保存失败: ${resp.status}`);
        }

        showSuccess('配置文件保存成功', showAlert);
        await refreshConfig();
      } catch (err) {
        showError(err instanceof Error ? err.message : '保存失败', showAlert);
        throw err;
      }
    });
  };



  if (!config) {
    return (
      <div className='text-center text-gray-500 dark:text-gray-400'>
        加载中...
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* 配置订阅区域 */}
      <Card variant='default'>
        <Card.Header className='flex items-center justify-between gap-4'>
          <Card.Title>配置订阅</Card.Title>
          <Card.Description className='text-right'>
            最后更新: {lastCheckTime ? new Date(lastCheckTime).toLocaleString('zh-CN') : '从未更新'}
          </Card.Description>
        </Card.Header>
        <Card.Content className='space-y-6'>
          <TextField fullWidth type='url'>
            <Label>订阅URL</Label>
            <Input
              value={subscriptionUrl}
              onChange={(e) => setSubscriptionUrl(e.target.value)}
              placeholder='https://example.com/config.json'
              variant='secondary'
            />
            <p className='text-xs text-muted'>
              输入配置文件的订阅地址，要求 JSON 格式，且使用 Base58 编码
            </p>
          </TextField>

          <Button
            fullWidth
            isDisabled={isLoading('fetchConfig') || !subscriptionUrl.trim()}
            isPending={isLoading('fetchConfig')}
            onPress={() => void handleFetchConfig()}
          >
            {isLoading('fetchConfig') ? '拉取中…' : '拉取配置'}
          </Button>

          <AdminSettingSwitch
            label='自动更新'
            description='启用后系统将定期自动拉取最新配置'
            isSelected={autoUpdate}
            onChange={setAutoUpdate}
          />
        </Card.Content>
      </Card>

      {/* 配置文件编辑区域 */}
      <Card variant='default'>
        <Card.Content className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='admin-config-file-content'>配置文件内容</Label>
            <TextArea
              id='admin-config-file-content'
              aria-label='配置文件内容'
              value={configContent}
              onChange={(e) => setConfigContent(e.target.value)}
              rows={20}
              placeholder='请输入配置文件内容（JSON 格式）...'
              className='font-mono text-sm leading-relaxed'
              fullWidth
              variant='secondary'
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
              }}
              spellCheck={false}
              data-gramm={false}
            />
          </div>

          <div className='flex items-center justify-between gap-4'>
            <Card.Description>
              支持 JSON 格式，用于配置视频源和自定义分类
            </Card.Description>
            <Button
              isPending={isLoading('saveConfig')}
              onPress={() => void handleSave()}
            >
              {isLoading('saveConfig') ? '保存中…' : '保存'}
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* 通用弹窗组件 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        timer={alertModal.timer}
        showConfirm={alertModal.showConfirm}
      />
    </div>
  );
};

// 新增站点配置组件
const SiteConfigComponent = ({ config, refreshConfig }: { config: AdminConfig | null; refreshConfig: () => Promise<void> }) => {
  const { alertModal, showAlert, hideAlert } = useAlertModal();
  const { isLoading, withLoading } = useLoadingState();
  const [siteSettings, setSiteSettings] = useState<SiteConfig>({
    SiteName: '',
    Announcement: '',
    SearchDownstreamMaxPage: 1,
    SiteInterfaceCacheTime: 7200,
    DoubanProxyType: 'cmliussss-cdn-tencent',
    DoubanProxy: '',
    DoubanImageProxyType: 'cmliussss-cdn-tencent',
    DoubanImageProxy: '',
    DisableYellowFilter: false,
    FluidSearch: true,
    RequireDeviceCode: true,
  });

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

  useEffect(() => {
    if (config?.SiteConfig) {
      setSiteSettings({
        ...config.SiteConfig,
        DoubanProxyType: config.SiteConfig.DoubanProxyType || 'cmliussss-cdn-tencent',
        DoubanProxy: config.SiteConfig.DoubanProxy || '',
        DoubanImageProxyType:
          config.SiteConfig.DoubanImageProxyType || 'cmliussss-cdn-tencent',
        DoubanImageProxy: config.SiteConfig.DoubanImageProxy || '',
        DisableYellowFilter: config.SiteConfig.DisableYellowFilter || false,
        FluidSearch: config.SiteConfig.FluidSearch || true,
        RequireDeviceCode: config.SiteConfig.RequireDeviceCode !== undefined ? config.SiteConfig.RequireDeviceCode : true,
      });
    }
  }, [config]);

  // 处理豆瓣数据源变化
  const handleDoubanDataSourceChange = (value: string) => {
    setSiteSettings((prev) => ({
      ...prev,
      DoubanProxyType: value,
    }));
  };

  // 处理豆瓣图片代理变化
  const handleDoubanImageProxyChange = (value: string) => {
    setSiteSettings((prev) => ({
      ...prev,
      DoubanImageProxyType: value,
    }));
  };

  // 保存站点配置
  const handleSave = async () => {
    await withLoading('saveSiteConfig', async () => {
      try {
        const resp = await fetch('/api/admin/site', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...siteSettings }),
        });

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data.error || `保存失败: ${resp.status}`);
        }

        showSuccess('保存成功, 请刷新页面', showAlert);
        await refreshConfig();
      } catch (err) {
        showError(err instanceof Error ? err.message : '保存失败', showAlert);
        throw err;
      }
    });
  };

  if (!config) {
    return (
      <div className='text-center text-gray-500 dark:text-gray-400'>
        加载中...
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <TextField fullWidth>
        <Label>站点名称</Label>
        <Input
          value={siteSettings.SiteName}
          onChange={(e) =>
            setSiteSettings((prev) => ({ ...prev, SiteName: e.target.value }))
          }
          variant='secondary'
        />
      </TextField>

      <div className='space-y-2'>
        <Label htmlFor='site-announcement'>站点公告</Label>
        <TextArea
          id='site-announcement'
          aria-label='站点公告'
          value={siteSettings.Announcement}
          onChange={(e) =>
            setSiteSettings((prev) => ({
              ...prev,
              Announcement: e.target.value,
            }))
          }
          rows={3}
          fullWidth
          variant='secondary'
        />
      </div>

      <div className='space-y-3'>
        <AppFilterSelect
          label='豆瓣数据代理'
          value={siteSettings.DoubanProxyType}
          options={doubanDataSourceOptions}
          onChange={handleDoubanDataSourceChange}
        />
        <p className='text-xs text-muted'>选择获取豆瓣数据的方式</p>

        {getThanksInfo(siteSettings.DoubanProxyType) && (
          <Button
            fullWidth
            variant='ghost'
            onPress={() =>
              window.open(
                getThanksInfo(siteSettings.DoubanProxyType)!.url,
                '_blank'
              )
            }
          >
            {getThanksInfo(siteSettings.DoubanProxyType)!.text}
            <ExternalLink className='w-3.5' />
          </Button>
        )}

        {siteSettings.DoubanProxyType === 'custom' && (
          <TextField fullWidth>
            <Label>豆瓣代理地址</Label>
            <Input
              placeholder='例如: https://proxy.example.com/fetch?url='
              value={siteSettings.DoubanProxy}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  DoubanProxy: e.target.value,
                }))
              }
              variant='secondary'
            />
            <p className='text-xs text-muted'>自定义代理服务器地址</p>
          </TextField>
        )}
      </div>

      <div className='space-y-3'>
        <AppFilterSelect
          label='豆瓣图片代理'
          value={siteSettings.DoubanImageProxyType}
          options={doubanImageProxyTypeOptions}
          onChange={handleDoubanImageProxyChange}
        />
        <p className='text-xs text-muted'>选择获取豆瓣图片的方式</p>

        {getThanksInfo(siteSettings.DoubanImageProxyType) && (
          <Button
            fullWidth
            variant='ghost'
            onPress={() =>
              window.open(
                getThanksInfo(siteSettings.DoubanImageProxyType)!.url,
                '_blank'
              )
            }
          >
            {getThanksInfo(siteSettings.DoubanImageProxyType)!.text}
            <ExternalLink className='w-3.5' />
          </Button>
        )}

        {siteSettings.DoubanImageProxyType === 'custom' && (
          <TextField fullWidth>
            <Label>豆瓣图片代理地址</Label>
            <Input
              placeholder='例如: https://proxy.example.com/fetch?url='
              value={siteSettings.DoubanImageProxy}
              onChange={(e) =>
                setSiteSettings((prev) => ({
                  ...prev,
                  DoubanImageProxy: e.target.value,
                }))
              }
              variant='secondary'
            />
            <p className='text-xs text-muted'>自定义图片代理服务器地址</p>
          </TextField>
        )}
      </div>

      <TextField fullWidth type='number'>
        <Label>搜索接口可拉取最大页数</Label>
        <Input
          min={1}
          value={siteSettings.SearchDownstreamMaxPage}
          onChange={(e) =>
            setSiteSettings((prev) => ({
              ...prev,
              SearchDownstreamMaxPage: Number(e.target.value),
            }))
          }
          variant='secondary'
        />
      </TextField>

      <TextField fullWidth type='number'>
        <Label>站点接口缓存时间（秒）</Label>
        <Input
          min={1}
          value={siteSettings.SiteInterfaceCacheTime}
          onChange={(e) =>
            setSiteSettings((prev) => ({
              ...prev,
              SiteInterfaceCacheTime: Number(e.target.value),
            }))
          }
          variant='secondary'
        />
      </TextField>

      <AdminSettingSwitch
        label='启用设备码验证'
        description='启用后用户登录时需要绑定设备码，提升账户安全性。禁用后用户可以直接登录而无需绑定设备码。'
        isSelected={siteSettings.RequireDeviceCode}
        onChange={(isSelected) =>
          setSiteSettings((prev) => ({
            ...prev,
            RequireDeviceCode: isSelected,
          }))
        }
      />

      <AdminSettingSwitch
        label='禁用黄色过滤器'
        description='禁用黄色内容的过滤功能，允许显示所有内容。'
        isSelected={siteSettings.DisableYellowFilter}
        onChange={(isSelected) =>
          setSiteSettings((prev) => ({
            ...prev,
            DisableYellowFilter: isSelected,
          }))
        }
      />

      <AdminSettingSwitch
        label='启用流式搜索'
        description='启用后搜索结果将实时流式返回，提升用户体验。'
        isSelected={siteSettings.FluidSearch}
        onChange={(isSelected) =>
          setSiteSettings((prev) => ({
            ...prev,
            FluidSearch: isSelected,
          }))
        }
      />

      <div className='flex justify-end'>
        <Button
          isPending={isLoading('saveSiteConfig')}
          onPress={() => void handleSave()}
        >
          {isLoading('saveSiteConfig') ? '保存中…' : '保存'}
        </Button>
      </div>

      {/* 通用弹窗组件 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        timer={alertModal.timer}
        showConfirm={alertModal.showConfirm}
      />
    </div>
  );
};

// 直播源配置组件
const LiveSourceConfig = ({
  config,
  refreshConfig,
}: {
  config: AdminConfig | null;
  refreshConfig: () => Promise<void>;
}) => {
  const { alertModal, showAlert, hideAlert } = useAlertModal();
  const { isLoading, withLoading } = useLoadingState();
  const [liveSources, setLiveSources] = useState<LiveDataSource[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLiveSource, setEditingLiveSource] = useState<LiveDataSource | null>(null);
  const [orderChanged, setOrderChanged] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newLiveSource, setNewLiveSource] = useState<LiveDataSource>({
    name: '',
    key: '',
    url: '',
    ua: '',
    epg: '',
    disabled: false,
    from: 'custom',
  });

  // dnd-kit 传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 轻微位移即可触发
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // 长按 150ms 后触发，避免与滚动冲突
        tolerance: 5,
      },
    })
  );

  // 初始化
  useEffect(() => {
    if (config?.LiveConfig) {
      setLiveSources(config.LiveConfig);
      // 进入时重置 orderChanged
      setOrderChanged(false);
    }
  }, [config]);

  // 通用 API 请求
  const callLiveSourceApi = async (body: Record<string, any>) => {
    try {
      const resp = await fetch('/api/admin/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `操作失败: ${resp.status}`);
      }

      // 成功后刷新配置
      await refreshConfig();
    } catch (err) {
      showError(err instanceof Error ? err.message : '操作失败', showAlert);
      throw err; // 向上抛出方便调用处判断
    }
  };

  const handleToggleEnable = (key: string) => {
    const target = liveSources.find((s) => s.key === key);
    if (!target) return;
    const action = target.disabled ? 'enable' : 'disable';
    withLoading(`toggleLiveSource_${key}`, () => callLiveSourceApi({ action, key })).catch(() => {
      console.error('操作失败', action, key);
    });
  };

  const handleDelete = (key: string) => {
    withLoading(`deleteLiveSource_${key}`, () => callLiveSourceApi({ action: 'delete', key })).catch(() => {
      console.error('操作失败', 'delete', key);
    });
  };

  // 刷新直播源
  const handleRefreshLiveSources = async () => {
    if (isRefreshing) return;

    await withLoading('refreshLiveSources', async () => {
      setIsRefreshing(true);
      try {
        const response = await fetch('/api/admin/live/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `刷新失败: ${response.status}`);
        }

        // 刷新成功后重新获取配置
        await refreshConfig();
        showAlert({ type: 'success', title: '刷新成功', message: '直播源已刷新', timer: 2000 });
      } catch (err) {
        showError(err instanceof Error ? err.message : '刷新失败', showAlert);
        throw err;
      } finally {
        setIsRefreshing(false);
      }
    });
  };

  const handleAddLiveSource = () => {
    if (!newLiveSource.name || !newLiveSource.key || !newLiveSource.url) return;
    withLoading('addLiveSource', async () => {
      await callLiveSourceApi({
        action: 'add',
        key: newLiveSource.key,
        name: newLiveSource.name,
        url: newLiveSource.url,
        ua: newLiveSource.ua,
        epg: newLiveSource.epg,
      });
      setNewLiveSource({
        name: '',
        key: '',
        url: '',
        epg: '',
        ua: '',
        disabled: false,
        from: 'custom',
      });
      setShowAddForm(false);
    }).catch(() => {
      console.error('操作失败', 'add', newLiveSource);
    });
  };

  const handleEditLiveSource = () => {
    if (!editingLiveSource || !editingLiveSource.name || !editingLiveSource.url) return;
    withLoading('editLiveSource', async () => {
      await callLiveSourceApi({
        action: 'edit',
        key: editingLiveSource.key,
        name: editingLiveSource.name,
        url: editingLiveSource.url,
        ua: editingLiveSource.ua,
        epg: editingLiveSource.epg,
      });
      setEditingLiveSource(null);
    }).catch(() => {
      console.error('操作失败', 'edit', editingLiveSource);
    });
  };

  const handleCancelEdit = () => {
    setEditingLiveSource(null);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = liveSources.findIndex((s) => s.key === active.id);
    const newIndex = liveSources.findIndex((s) => s.key === over.id);
    setLiveSources((prev) => arrayMove(prev, oldIndex, newIndex));
    setOrderChanged(true);
  };

  const handleSaveOrder = () => {
    const order = liveSources.map((s) => s.key);
    withLoading('saveLiveSourceOrder', () => callLiveSourceApi({ action: 'sort', order }))
      .then(() => {
        setOrderChanged(false);
      })
      .catch(() => {
        console.error('操作失败', 'sort', order);
      });
  };

  // 可拖拽行封装 (dnd-kit)
  const DraggableRow = ({ liveSource }: { liveSource: LiveDataSource }) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: liveSource.key });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    } as React.CSSProperties;

    return (
      <Table.Row
        ref={setNodeRef}
        style={style}
        id={liveSource.key}
        className='select-none'
      >
        <Table.Cell
          className='cursor-grab text-muted'
          style={{ touchAction: 'none' }}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </Table.Cell>
        <Table.Cell>
          {liveSource.name}
        </Table.Cell>
        <Table.Cell>
          {liveSource.key}
        </Table.Cell>
        <Table.Cell className='max-w-[12rem]'>
          <span className='block truncate' title={liveSource.url}>
            {liveSource.url}
          </span>
        </Table.Cell>
        <Table.Cell className='max-w-[8rem]'>
          <span className='block truncate' title={liveSource.epg || '-'}>
            {liveSource.epg || '-'}
          </span>
        </Table.Cell>
        <Table.Cell className='max-w-[8rem]'>
          <span className='block truncate' title={liveSource.ua || '-'}>
            {liveSource.ua || '-'}
          </span>
        </Table.Cell>
        <Table.Cell className='text-center'>
          {liveSource.channelNumber && liveSource.channelNumber > 0 ? liveSource.channelNumber : '-'}
        </Table.Cell>
        <Table.Cell>
          <AdminChip color={!liveSource.disabled ? 'success' : 'danger'}>
            {!liveSource.disabled ? '启用中' : '已禁用'}
          </AdminChip>
        </Table.Cell>
        <Table.Cell>
          <div className='flex justify-end gap-2'>
          <Button
            size='sm'
            variant={!liveSource.disabled ? 'danger-soft' : 'secondary'}
            onPress={() => handleToggleEnable(liveSource.key)}
            isDisabled={isLoading(`toggleLiveSource_${liveSource.key}`)}
          >
            {!liveSource.disabled ? '禁用' : '启用'}
          </Button>
          {liveSource.from !== 'config' && (
            <>
              <Button
                size='sm'
                variant='secondary'
                onPress={() => setEditingLiveSource(liveSource)}
                isDisabled={isLoading(`editLiveSource_${liveSource.key}`)}
              >
                编辑
              </Button>
              <Button
                size='sm'
                variant='danger-soft'
                onPress={() => handleDelete(liveSource.key)}
                isDisabled={isLoading(`deleteLiveSource_${liveSource.key}`)}
              >
                删除
              </Button>
            </>
          )}
          </div>
        </Table.Cell>
      </Table.Row>
    );
  };

  if (!config) {
    return (
      <div className='text-center text-gray-500 dark:text-gray-400'>
        加载中...
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 添加直播源表单 */}
      <div className='flex items-center justify-between'>
        <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
          直播源列表
        </h4>
        <div className='flex items-center space-x-2'>
          <Button
            size='sm'
            variant='primary'
            onPress={handleRefreshLiveSources}
            isDisabled={isRefreshing || isLoading('refreshLiveSources')}
          >
            <span>{isRefreshing || isLoading('refreshLiveSources') ? '刷新中...' : '刷新直播源'}</span>
          </Button>
          <Button
            size='sm'
            variant={showAddForm ? 'secondary' : 'primary'}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '取消' : '添加直播源'}
          </Button>
        </div>
      </div>

      {showAddForm && (
        <div className='p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <input
              type='text'
              placeholder='名称'
              value={newLiveSource.name}
              onChange={(e) =>
                setNewLiveSource((prev) => ({ ...prev, name: e.target.value }))
              }
              className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            />
            <input
              type='text'
              placeholder='Key'
              value={newLiveSource.key}
              onChange={(e) =>
                setNewLiveSource((prev) => ({ ...prev, key: e.target.value }))
              }
              className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            />
            <input
              type='text'
              placeholder='M3U 地址'
              value={newLiveSource.url}
              onChange={(e) =>
                setNewLiveSource((prev) => ({ ...prev, url: e.target.value }))
              }
              className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            />
            <input
              type='text'
              placeholder='节目单地址（选填）'
              value={newLiveSource.epg}
              onChange={(e) =>
                setNewLiveSource((prev) => ({ ...prev, epg: e.target.value }))
              }
              className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            />
            <input
              type='text'
              placeholder='自定义 UA（选填）'
              value={newLiveSource.ua}
              onChange={(e) =>
                setNewLiveSource((prev) => ({ ...prev, ua: e.target.value }))
              }
              className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            />

          </div>
          <div className='flex justify-end'>
            <button
              onClick={handleAddLiveSource}
              disabled={!newLiveSource.name || !newLiveSource.key || !newLiveSource.url || isLoading('addLiveSource')}
              className={`w-full sm:w-auto px-4 py-2 ${!newLiveSource.name || !newLiveSource.key || !newLiveSource.url || isLoading('addLiveSource') ? buttonStyles.disabled : buttonStyles.success}`}
            >
              {isLoading('addLiveSource') ? '添加中...' : '添加'}
            </button>
          </div>
        </div>
      )}

      {/* 编辑直播源表单 */}
      {editingLiveSource && (
        <div className='p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4'>
          <div className='flex items-center justify-between'>
            <h5 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              编辑直播源: {editingLiveSource.name}
            </h5>
            <button
              onClick={handleCancelEdit}
              className='text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            >
              ✕
            </button>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                名称
              </label>
              <input
                type='text'
                value={editingLiveSource.name}
                onChange={(e) =>
                  setEditingLiveSource((prev) => prev ? ({ ...prev, name: e.target.value }) : null)
                }
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Key (不可编辑)
              </label>
              <input
                type='text'
                value={editingLiveSource.key}
                disabled
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                M3U 地址
              </label>
              <input
                type='text'
                value={editingLiveSource.url}
                onChange={(e) =>
                  setEditingLiveSource((prev) => prev ? ({ ...prev, url: e.target.value }) : null)
                }
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                节目单地址（选填）
              </label>
              <input
                type='text'
                value={editingLiveSource.epg}
                onChange={(e) =>
                  setEditingLiveSource((prev) => prev ? ({ ...prev, epg: e.target.value }) : null)
                }
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                自定义 UA（选填）
              </label>
              <input
                type='text'
                value={editingLiveSource.ua}
                onChange={(e) =>
                  setEditingLiveSource((prev) => prev ? ({ ...prev, ua: e.target.value }) : null)
                }
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              />
            </div>
          </div>
          <div className='flex justify-end space-x-2'>
            <button
              onClick={handleCancelEdit}
              className={buttonStyles.secondary}
            >
              取消
            </button>
            <button
              onClick={handleEditLiveSource}
              disabled={!editingLiveSource.name || !editingLiveSource.url || isLoading('editLiveSource')}
              className={`${!editingLiveSource.name || !editingLiveSource.url || isLoading('editLiveSource') ? buttonStyles.disabled : buttonStyles.success}`}
            >
              {isLoading('editLiveSource') ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      )}

      {/* 直播源表格 */}
      <AdminTable ariaLabel='直播源列表' minWidth='min-w-[1100px]'>
          <Table.Header>
              <Table.Column className='w-8' />
              <Table.Column isRowHeader>
                名称
              </Table.Column>
              <Table.Column>
                Key
              </Table.Column>
              <Table.Column>
                M3U 地址
              </Table.Column>
              <Table.Column>
                节目单地址
              </Table.Column>
              <Table.Column>
                自定义 UA
              </Table.Column>
              <Table.Column>
                频道数
              </Table.Column>
              <Table.Column>
                状态
              </Table.Column>
              <Table.Column className='text-right'>
                操作
              </Table.Column>
          </Table.Header>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            autoScroll={false}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={liveSources.map((s) => s.key)}
              strategy={verticalListSortingStrategy}
            >
              <Table.Body>
                {liveSources.map((liveSource) => (
                  <DraggableRow key={liveSource.key} liveSource={liveSource} />
                ))}
              </Table.Body>
            </SortableContext>
          </DndContext>
      </AdminTable>

      {/* 保存排序按钮 */}
      {orderChanged && (
        <div className='flex justify-end'>
          <Button
            size='sm'
            variant='primary'
            onPress={handleSaveOrder}
            isDisabled={isLoading('saveLiveSourceOrder')}
          >
            {isLoading('saveLiveSourceOrder') ? '保存中...' : '保存排序'}
          </Button>
        </div>
      )}

      {/* 通用弹窗组件 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        timer={alertModal.timer}
        showConfirm={alertModal.showConfirm}
      />


    </div>
  );
};

function AdminPageClient() {
  const { alertModal, showAlert, hideAlert } = useAlertModal();
  const { isLoading, withLoading } = useLoadingState();
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'owner' | 'admin' | null>(null);
  const [showResetConfigModal, setShowResetConfigModal] = useState(false);
  const [expandedTabs, setExpandedTabs] = useState<{ [key: string]: boolean }>({
    userConfig: false,
    videoSource: false,
    liveSource: false,
    siteConfig: false,
    categoryConfig: false,
    configFile: false,
    dataMigration: false,
    themeManager: false,
  });

  // 机器码管理状态
  const [machineCodeUsers, setMachineCodeUsers] = useState<Record<string, { machineCode: string; deviceInfo?: string; bindTime: number }>>({});

  // 获取机器码用户列表
  const fetchMachineCodeUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/machine-code?action=list');
      if (response.ok) {
        const data = await response.json();
        setMachineCodeUsers(data.users || {});
      }
    } catch (error) {
      console.error('获取机器码用户列表失败:', error);
    }
  }, []);

  // 获取管理员配置
  // showLoading 用于控制是否在请求期间显示整体加载骨架。
  const fetchConfig = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const response = await fetch(`/api/admin/config`);

      if (!response.ok) {
        const data = (await response.json()) as any;
        throw new Error(`获取配置失败: ${data.error}`);
      }

      const data = (await response.json()) as AdminConfigResult;
      setConfig(data.Config);
      setRole(data.Role);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '获取配置失败';
      showError(msg, showAlert);
      setError(msg);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // 首次加载时显示骨架
    fetchConfig(true);
    // 获取机器码用户列表
    fetchMachineCodeUsers();
  }, [fetchConfig, fetchMachineCodeUsers]);

  // 切换标签展开状态
  const toggleTab = (tabKey: string) => {
    setExpandedTabs((prev) => ({
      ...prev,
      [tabKey]: !prev[tabKey],
    }));
  };

  // 新增: 重置配置处理函数
  const handleResetConfig = () => {
    setShowResetConfigModal(true);
  };

  const handleConfirmResetConfig = async () => {
    await withLoading('resetConfig', async () => {
      try {
        const response = await fetch(`/api/admin/reset`);
        if (!response.ok) {
          throw new Error(`重置失败: ${response.status}`);
        }
        showSuccess('重置成功，请刷新页面！', showAlert);
        await fetchConfig();
        await fetchMachineCodeUsers(); // 重新获取机器码数据
        setShowResetConfigModal(false);
      } catch (err) {
        showError(err instanceof Error ? err.message : '重置失败', showAlert);
        throw err;
      }
    });
  };

  if (loading) {
    return (
      <PageLayout activePath='/admin'>
        <div className='px-2 sm:px-10 py-4 sm:py-8'>
          <div className='max-w-[95%] mx-auto'>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8'>
              管理员设置
            </h1>
            <div className='space-y-4'>
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className='h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse'
                />
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    // 错误已通过弹窗展示，此处直接返回空
    return null;
  }

  return (
    <PageLayout activePath='/admin'>
      <div className='px-2 sm:px-10 py-4 sm:py-8'>
        <div className='max-w-[95%] mx-auto'>
          {/* 标题 + 重置配置按钮 */}
          <div className='flex items-center gap-2 mb-8'>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
              管理员设置
            </h1>
            {config && role === 'owner' && (
              <Button
                size='sm'
                variant='danger-soft'
                onPress={handleResetConfig}
              >
                重置配置
              </Button>
            )}
          </div>

          {/* 配置文件标签 - 仅站长可见 */}
          {role === 'owner' && (
            <CollapsibleTab
              title='配置文件'
              icon={
                <FileText
                  size={20}
                  className='text-gray-600 dark:text-gray-400'
                />
              }
              isExpanded={expandedTabs.configFile}
              onToggle={() => toggleTab('configFile')}
            >
              <ConfigFileComponent config={config} refreshConfig={fetchConfig} />
            </CollapsibleTab>
          )}

          {/* 站点配置标签 */}
          <CollapsibleTab
            title='站点配置'
            icon={
              <Settings
                size={20}
                className='text-gray-600 dark:text-gray-400'
              />
            }
            isExpanded={expandedTabs.siteConfig}
            onToggle={() => toggleTab('siteConfig')}
          >
            <SiteConfigComponent config={config} refreshConfig={fetchConfig} />
          </CollapsibleTab>

          <div className='space-y-4'>
            {/* 用户配置标签 */}
            <CollapsibleTab
              title='用户配置'
              icon={
                <Users size={20} className='text-gray-600 dark:text-gray-400' />
              }
              isExpanded={expandedTabs.userConfig}
              onToggle={() => toggleTab('userConfig')}
            >
              <UserConfig
                config={config}
                role={role}
                refreshConfig={fetchConfig}
                machineCodeUsers={machineCodeUsers}
                fetchMachineCodeUsers={fetchMachineCodeUsers}
              />
            </CollapsibleTab>

            {/* 视频源配置标签 */}
            <CollapsibleTab
              title='视频源配置'
              icon={
                <Video size={20} className='text-gray-600 dark:text-gray-400' />
              }
              isExpanded={expandedTabs.videoSource}
              onToggle={() => toggleTab('videoSource')}
            >
              <VideoSourceConfig config={config} refreshConfig={fetchConfig} />
            </CollapsibleTab>

            {/* 直播源配置标签 */}
            <CollapsibleTab
              title='直播源配置'
              icon={
                <Tv size={20} className='text-gray-600 dark:text-gray-400' />
              }
              isExpanded={expandedTabs.liveSource}
              onToggle={() => toggleTab('liveSource')}
            >
              <LiveSourceConfig config={config} refreshConfig={fetchConfig} />
            </CollapsibleTab>

            {/* 分类配置标签 */}
            <CollapsibleTab
              title='分类配置'
              icon={
                <FolderOpen
                  size={20}
                  className='text-gray-600 dark:text-gray-400'
                />
              }
              isExpanded={expandedTabs.categoryConfig}
              onToggle={() => toggleTab('categoryConfig')}
            >
              <CategoryConfig config={config} refreshConfig={fetchConfig} />
            </CollapsibleTab>

            {/* 数据迁移标签 - 仅站长可见 */}
            {role === 'owner' && (
              <CollapsibleTab
                title='数据迁移'
                icon={
                  <Database
                    size={20}
                    className='text-gray-600 dark:text-gray-400'
                  />
                }
                isExpanded={expandedTabs.dataMigration}
                onToggle={() => toggleTab('dataMigration')}
              >
                <DataMigration onRefreshConfig={fetchConfig} />
              </CollapsibleTab>
            )}

            {/* 主题定制标签 */}
            <CollapsibleTab
              title='主题定制'
              icon={
                <Palette
                  size={20}
                  className='text-gray-600 dark:text-gray-400'
                />
              }
              isExpanded={expandedTabs.themeManager}
              onToggle={() => toggleTab('themeManager')}
            >
              <ThemeManager showAlert={showAlert} role={role} />
            </CollapsibleTab>
          </div>
        </div>
      </div>

      {/* 通用弹窗组件 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        timer={alertModal.timer}
        showConfirm={alertModal.showConfirm}
      />

      {/* 重置配置确认弹窗 */}
      <AppDialog
        isOpen={showResetConfigModal}
        onOpenChange={setShowResetConfigModal}
        title='确认重置配置'
        footer={
          <>
            <Button variant='secondary' onPress={() => setShowResetConfigModal(false)}>
              取消
            </Button>
            <Button
              variant='primary'
              onPress={handleConfirmResetConfig}
              isDisabled={isLoading('resetConfig')}
            >
              {isLoading('resetConfig') ? '重置中...' : '确认重置'}
            </Button>
          </>
        }
      >
        <Alert status='warning'>
          <Alert.Content>
            <Alert.Title>危险操作警告</Alert.Title>
            <Alert.Description>
              此操作将重置用户封禁和管理员设置、自定义视频源，站点配置将重置为默认值，是否继续？
            </Alert.Description>
          </Alert.Content>
        </Alert>
      </AppDialog>
    </PageLayout>
  );
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminPageClient />
    </Suspense>
  );
}
