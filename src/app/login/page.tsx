/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { Alert, Checkbox, Form, Input, Label, Link, TextField } from '@heroui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { CURRENT_VERSION } from '@/lib/version';
import { checkForUpdates, UpdateStatus } from '@/lib/version_check';
import MachineCode from '@/lib/machine-code';

import { useSite } from '@/components/SiteProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import GlobalThemeLoader from '@/components/GlobalThemeLoader';
import { AppButton, AppSurface } from '@/components/ui/HeroPrimitives';

// 版本显示组件
function VersionDisplay() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const status = await checkForUpdates();
        setUpdateStatus(status);
      } catch (_) {
        // do nothing
      } finally {
        setIsChecking(false);
      }
    };

    checkUpdate();
  }, []);

  return (
    <Link
      href='https://github.com/djteang/OrangeTV'
      target='_blank'
      className='absolute bottom-4 left-1/2 -translate-x-1/2 text-xs'
    >
      <span className='font-mono'>v{CURRENT_VERSION}</span>
      {!isChecking && updateStatus !== UpdateStatus.FETCH_FAILED && (
        <div
          className={`flex items-center gap-1.5 ${updateStatus === UpdateStatus.HAS_UPDATE
            ? 'text-yellow-600 dark:text-yellow-400'
            : updateStatus === UpdateStatus.NO_UPDATE
              ? 'text-success'
              : ''
            }`}
        >
          {updateStatus === UpdateStatus.HAS_UPDATE && (
            <>
              <AlertCircle className='w-3.5 h-3.5' />
              <span className='font-semibold text-xs'>有新版本</span>
            </>
          )}
          {updateStatus === UpdateStatus.NO_UPDATE && (
            <>
              <CheckCircle className='w-3.5 h-3.5' />
              <span className='font-semibold text-xs'>已是最新</span>
            </>
          )}
        </div>
      )}
    </Link>
  );
}

function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shouldAskUsername, setShouldAskUsername] = useState(false);

  // 机器码相关状态
  const [machineCode, setMachineCode] = useState<string>('');
  const [deviceInfo, setDeviceInfo] = useState<string>('');
  const [, setShowMachineCodeInput] = useState(false);
  const [requireMachineCode, setRequireMachineCode] = useState(false);
  const [machineCodeGenerated, setMachineCodeGenerated] = useState(false);
  const [, setShowBindOption] = useState(false);
  const [bindMachineCode, setBindMachineCode] = useState(false);
  const [deviceCodeEnabled, setDeviceCodeEnabled] = useState(true); // 站点是否启用设备码功能

  const { siteName } = useSite();

  // 在客户端挂载后设置配置并生成机器码
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const runtimeConfig = (window as any).RUNTIME_CONFIG;
      const storageType = runtimeConfig?.STORAGE_TYPE;
      const requireDeviceCode = runtimeConfig?.REQUIRE_DEVICE_CODE;

      setShouldAskUsername(storageType && storageType !== 'localstorage');
      setDeviceCodeEnabled(requireDeviceCode !== false); // 默认启用，除非明确设置为 false

      // 只有在启用设备码功能时才生成机器码和设备信息
      const generateMachineInfo = async () => {
        if (requireDeviceCode !== false && MachineCode.isSupported()) {
          try {
            const code = await MachineCode.generateMachineCode();
            const info = await MachineCode.getDeviceInfo();
            setMachineCode(code);
            setDeviceInfo(info);
            setMachineCodeGenerated(true);
          } catch (error) {
            console.error('生成机器码失败:', error);
          }
        }
      };

      generateMachineInfo();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!password || (shouldAskUsername && !username)) return;

    try {
      setLoading(true);

      // 构建请求数据
      const requestData: any = {
        password,
        ...(shouldAskUsername ? { username } : {}),
      };

      // 只有在启用设备码功能时才处理机器码逻辑
      if (deviceCodeEnabled && (requireMachineCode || bindMachineCode) && machineCode) {
        requestData.machineCode = machineCode;
      }

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // 登录成功，如果启用设备码功能且用户选择绑定机器码，则绑定
        if (deviceCodeEnabled && bindMachineCode && machineCode && shouldAskUsername) {
          try {
            await fetch('/api/machine-code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                machineCode,
                deviceInfo,
              }),
            });
          } catch (bindError) {
            console.error('绑定机器码失败:', bindError);
          }
        }

        const redirect = searchParams.get('redirect') || '/';
        router.replace(redirect);
      } else if (res.status === 403) {
        // 处理机器码相关错误
        if (data.requireMachineCode) {
          setRequireMachineCode(true);
          setShowMachineCodeInput(true);
          setError('该账户已绑定设备，请验证机器码');
        } else if (data.machineCodeMismatch) {
          setError('机器码不匹配，此账户只能在绑定的设备上使用');
        } else {
          setError(data.error || '访问被拒绝');
        }
      } else if (res.status === 409) {
        // 机器码被其他用户绑定
        setError(data.error || '机器码冲突');
      } else if (res.status === 401) {
        setError('用户名或密码错误');
      } else {
        setError(data.error ?? '服务器错误');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className='relative min-h-screen flex items-center justify-center px-4 overflow-hidden'>
      <GlobalThemeLoader />
      <div className='absolute top-4 right-4'>
        <ThemeToggle />
      </div>
      <AppSurface className='relative z-10 w-full max-w-md p-8 sm:p-10'>
        <h1 className='mb-8 text-center text-3xl font-semibold'>
          {siteName}
        </h1>
        <Form onSubmit={handleSubmit} className='space-y-6'>
          {shouldAskUsername && (
            <TextField name='username' className='w-full'>
              <Label>用户名</Label>
              <Input
                id='username'
                type='text'
                autoComplete='username'
                placeholder='用户名'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </TextField>
          )}

          <TextField name='password' className='w-full'>
            <Label>密码</Label>
            <Input
              id='password'
              type='password'
              autoComplete='current-password'
              placeholder='密码'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </TextField>

          {/* 机器码信息显示 - 只有在启用设备码功能时才显示 */}
          {deviceCodeEnabled && machineCodeGenerated && shouldAskUsername && (
            <div className='space-y-4'>
              <Alert status='accent'>
                <Alert.Indicator>
                  <Shield className='w-4 h-4' />
                </Alert.Indicator>
                <Alert.Content>
                  <Alert.Title>设备识别码</Alert.Title>
                  <Alert.Description>
                    {MachineCode.formatMachineCode(machineCode)}
                    <br />
                    设备信息: {deviceInfo}
                  </Alert.Description>
                </Alert.Content>
              </Alert>

              {/* 绑定选项 */}
              {!requireMachineCode && (
                <div className='space-y-2'>
                  <Checkbox
                    id='bindMachineCode'
                    isSelected={bindMachineCode}
                    onChange={setBindMachineCode}
                  >
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Checkbox.Content>
                      绑定此设备（提升账户安全性）
                    </Checkbox.Content>
                  </Checkbox>
                  {/* <p className='text-xs text-gray-500 dark:text-gray-400 ml-7'>
                    // 管理员可选择不绑定机器码直接登录
                  </p> */}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
          )}

          {/* 登录按钮 */}
          <AppButton
            type='submit'
            fullWidth
            isDisabled={
              !password ||
              loading ||
              (shouldAskUsername && !username) ||
              (deviceCodeEnabled && machineCodeGenerated && shouldAskUsername && !requireMachineCode && !bindMachineCode)
            }
            isPending={loading}
          >
            {loading ? '登录中...' : '登录'}
          </AppButton>
        </Form>
      </AppSurface>

      {/* 版本信息显示 */}
      <VersionDisplay />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageClient />
    </Suspense>
  );
}
