/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { AlertCircle, AlertTriangle, CheckCircle, Download, FileCheck, Lock, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Chip, Input, Label, Spinner, TextField } from '@heroui/react';
import { AppDialog } from './ui/HeroPrimitives';

interface DataMigrationProps {
  onRefreshConfig?: () => Promise<void>;
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning';
  title: string;
  message?: string;
  html?: string;
  confirmText?: string;
  onConfirm?: () => void;
  showConfirm?: boolean;
  timer?: number;
}

const AlertModal = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  html,
  confirmText = '确定',
  onConfirm,
  showConfirm = false,
  timer
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
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
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
        showConfirm && onConfirm ? (
          <>
            <Button variant='secondary' onPress={onClose}>
              取消
            </Button>
            <Button
              variant='primary'
              onPress={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </Button>
          </>
        ) : (
          <Button variant='primary' onPress={onClose}>
            确定
          </Button>
        )
      }
    >
      <Alert status={getStatus()}>
        {message ? <p>{message}</p> : null}
        {html ? (
          <div
            className='text-sm leading-6'
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : null}
      </Alert>
    </AppDialog>
  );
};

const DataMigration = ({ onRefreshConfig }: DataMigrationProps) => {
  const [exportPassword, setExportPassword] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message?: string;
    html?: string;
    confirmText?: string;
    onConfirm?: () => void;
    showConfirm?: boolean;
    timer?: number;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showAlert = (config: Omit<typeof alertModal, 'isOpen'>) => {
    setAlertModal({ ...config, isOpen: true });
  };

  const hideAlert = () => {
    setAlertModal(prev => ({ ...prev, isOpen: false }));
  };

  // 导出数据
  const handleExport = async () => {
    if (!exportPassword.trim()) {
      showAlert({
        type: 'error',
        title: '错误',
        message: '请输入加密密码',
        showConfirm: true
      });
      return;
    }

    try {
      setIsExporting(true);

      const response = await fetch('/api/admin/data_migration/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: exportPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `导出失败: ${response.status}`);
      }

      // 获取文件名
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || 'OrangeTV-backup.dat';

      // 下载文件
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      a.style.position = 'fixed';
      a.style.top = '0';
      a.style.left = '0';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showAlert({
        type: 'success',
        title: '导出成功',
        message: '数据已成功导出，请妥善保管备份文件和密码',
        timer: 3000,
      });

      setExportPassword('');
    } catch (error) {
      showAlert({
        type: 'error',
        title: '导出失败',
        message: error instanceof Error ? error.message : '导出过程中发生错误',
        showConfirm: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 文件选择处理
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // 导入数据
  const handleImport = async () => {
    if (!selectedFile) {
      showAlert({
        type: 'error',
        title: '错误',
        message: '请选择备份文件',
        showConfirm: true
      });
      return;
    }

    if (!importPassword.trim()) {
      showAlert({
        type: 'error',
        title: '错误',
        message: '请输入解密密码',
        showConfirm: true
      });
      return;
    }

    try {
      setIsImporting(true);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('password', importPassword);

      const response = await fetch('/api/admin/data_migration/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `导入失败: ${response.status}`);
      }

      showAlert({
        type: 'success',
        title: '导入成功',
        html: `
          <div class="text-left">
            <p><strong>导入完成！</strong></p>
            <p class="mt-2">导入的用户数量: ${result.importedUsers}</p>
            <p>备份时间: ${new Date(result.timestamp).toLocaleString('zh-CN')}</p>
            <p>服务器版本: ${result.serverVersion || '未知版本'}</p>
            <p class="mt-3 text-orange-600">请刷新页面以查看最新数据。</p>
          </div>
        `,
        confirmText: '刷新页面',
        showConfirm: true,
        onConfirm: async () => {
          // 清理状态
          setSelectedFile(null);
          setImportPassword('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }

          // 刷新配置
          if (onRefreshConfig) {
            await onRefreshConfig();
          }

          // 刷新页面
          window.location.reload();
        },
      });
    } catch (error) {
      showAlert({
        type: 'error',
        title: '导入失败',
        message: error instanceof Error ? error.message : '导入过程中发生错误',
        showConfirm: true
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 简洁警告提示 */}
        <Alert status='warning'>
          数据迁移操作请谨慎，确保已备份重要数据
        </Alert>

        {/* 主要操作区域 - 响应式布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 数据导出 */}
          <Card variant='default' className='p-6'>
            <div className="flex items-center gap-3 mb-6">
              <Chip variant='secondary' size='lg'>
                <Download className="w-4 h-4" />
              </Chip>
              <div>
                <h3 className="font-semibold">数据导出</h3>
                <p className="text-sm text-muted">创建加密备份文件</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="space-y-4">
                {/* 密码输入 */}
                <TextField>
                  <Label className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    加密密码
                  </Label>
                  <Input
                    type="password"
                    value={exportPassword}
                    onChange={(e) => setExportPassword(e.target.value)}
                    placeholder="设置强密码保护备份文件"
                    disabled={isExporting}
                  />
                  <p className="text-xs text-muted">
                    导入时需要使用相同密码
                  </p>
                </TextField>

                {/* 备份内容列表 */}
                <div className="text-xs text-muted space-y-1">
                  <p className="font-medium text-foreground mb-2">备份内容：</p>
                  <div className="grid grid-cols-2 gap-1">
                    <div>• 管理配置</div>
                    <div>• 用户数据</div>
                    <div>• 播放记录</div>
                    <div>• 收藏夹</div>
                  </div>
                </div>
              </div>

              {/* 导出按钮 */}
              <Button
                fullWidth
                variant='primary'
                className='mt-10'
                onPress={handleExport}
                isDisabled={isExporting || !exportPassword.trim()}
              >
                {isExporting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Spinner size='sm' />
                    导出中...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    导出数据
                  </div>
                )}
              </Button>
            </div>
          </Card>

          {/* 数据导入 */}
          <Card variant='default' className='p-6'>
            <div className="flex items-center gap-3 mb-6">
              <Chip color='danger' variant='secondary' size='lg'>
                <Upload className="w-4 h-4" />
              </Chip>
              <div>
                <h3 className="font-semibold">数据导入</h3>
                <p className="text-sm text-danger">将清空现有数据</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="space-y-4">
                {/* 文件选择 */}
                <div className='space-y-2'>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <FileCheck className="w-4 h-4" />
                    备份文件
                    {selectedFile && (
                      <span className="ml-auto text-xs text-success font-normal">
                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".dat"
                    onChange={handleFileSelect}
                    className="sr-only"
                    disabled={isImporting}
                  />
                  <Button
                    variant='secondary'
                    onPress={() => fileInputRef.current?.click()}
                    isDisabled={isImporting}
                  >
                    <FileCheck className='h-4 w-4' />
                    选择备份文件
                  </Button>
                </div>

                {/* 密码输入 */}
                <TextField>
                  <Label className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    解密密码
                  </Label>
                  <Input
                    type="password"
                    value={importPassword}
                    onChange={(e) => setImportPassword(e.target.value)}
                    placeholder="输入导出时的加密密码"
                    disabled={isImporting}
                  />
                </TextField>
              </div>

              {/* 导入按钮 */}
              <Button
                fullWidth
                variant='primary'
                className='mt-10'
                onPress={handleImport}
                isDisabled={isImporting || !selectedFile || !importPassword.trim()}
              >
                {isImporting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Spinner size='sm' />
                    导入中...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    导入数据
                  </div>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* 弹窗组件 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        html={alertModal.html}
        confirmText={alertModal.confirmText}
        onConfirm={alertModal.onConfirm}
        showConfirm={alertModal.showConfirm}
        timer={alertModal.timer}
      />
    </>
  );
};

export default DataMigration;
