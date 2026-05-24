/* eslint-disable no-console,react-hooks/exhaustive-deps */

'use client';

import {
  Bug,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Alert, Button, Card, Chip, Link as HeroLink } from '@heroui/react';
import { useEffect, useState } from 'react';

import { changelog, ChangelogEntry } from '@/lib/changelog';
import { CURRENT_VERSION } from '@/lib/version';
import { compareVersions, UpdateStatus } from '@/lib/version_check';

import { AppDialog } from './ui/HeroPrimitives';

interface VersionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RemoteChangelogEntry {
  version: string;
  date: string;
  added: string[];
  changed: string[];
  fixed: string[];
}

export const VersionPanel: React.FC<VersionPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);
  const [remoteChangelog, setRemoteChangelog] = useState<ChangelogEntry[]>([]);
  const [hasUpdate, setIsHasUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [showRemoteContent, setShowRemoteContent] = useState(false);

  // 确保组件已挂载
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // 获取远程变更日志
  useEffect(() => {
    if (isOpen) {
      fetchRemoteChangelog();
    }
  }, [isOpen]);

  // 获取远程变更日志
  const fetchRemoteChangelog = async () => {
    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/djteang/OrangeTV/refs/heads/main/CHANGELOG'
      );
      if (response.ok) {
        const content = await response.text();
        const parsed = parseChangelog(content);
        setRemoteChangelog(parsed);

        // 检查是否有更新 - 基于日期而非版本号数字大小来确定最新版本
        if (parsed.length > 0) {
          // 按日期排序，找到真正的最新版本
          const sortedByDate = [...parsed].sort((a, b) => {
            // 解析日期进行比较
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime(); // 降序排列，最新的在前
          });

          const latest = sortedByDate[0];
          setLatestVersion(latest.version);
          setIsHasUpdate(
            compareVersions(latest.version) === UpdateStatus.HAS_UPDATE
          );
        }
      } else {
        console.error(
          '获取远程变更日志失败:',
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error('获取远程变更日志失败:', error);
    }
  };

  // 解析变更日志格式
  const parseChangelog = (content: string): RemoteChangelogEntry[] => {
    const lines = content.split('\n');
    const versions: RemoteChangelogEntry[] = [];
    let currentVersion: RemoteChangelogEntry | null = null;
    let currentSection: string | null = null;
    let inVersionContent = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // 匹配版本行: ## [X.Y.Z] - YYYY-MM-DD
      const versionMatch = trimmedLine.match(
        /^## \[([\d.]+)\] - (\d{4}-\d{2}-\d{2})$/
      );
      if (versionMatch) {
        if (currentVersion) {
          versions.push(currentVersion);
        }

        currentVersion = {
          version: versionMatch[1],
          date: versionMatch[2],
          added: [],
          changed: [],
          fixed: [],
        };
        currentSection = null;
        inVersionContent = true;
        continue;
      }

      // 如果遇到下一个版本或到达文件末尾，停止处理当前版本
      if (inVersionContent && currentVersion) {
        // 匹配章节标题
        if (trimmedLine === '### Added') {
          currentSection = 'added';
          continue;
        } else if (trimmedLine === '### Changed') {
          currentSection = 'changed';
          continue;
        } else if (trimmedLine === '### Fixed') {
          currentSection = 'fixed';
          continue;
        }

        // 匹配条目: - 内容
        if (trimmedLine.startsWith('- ') && currentSection) {
          const entry = trimmedLine.substring(2);
          if (currentSection === 'added') {
            currentVersion.added.push(entry);
          } else if (currentSection === 'changed') {
            currentVersion.changed.push(entry);
          } else if (currentSection === 'fixed') {
            currentVersion.fixed.push(entry);
          }
        }
      }
    }

    // 添加最后一个版本
    if (currentVersion) {
      versions.push(currentVersion);
    }

    return versions;
  };

  // 渲染变更日志条目
  const renderChangelogEntry = (
    entry: ChangelogEntry | RemoteChangelogEntry,
    isCurrentVersion = false,
    isRemote = false
  ) => {
    const isUpdate = isRemote && hasUpdate && entry.version === latestVersion;

    return (
      <Card
        key={entry.version}
        className='p-4'
      >
        {/* 版本标题 */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <h4 className='text-lg font-semibold text-foreground'>
              v{entry.version}
            </h4>
            {isCurrentVersion && (
              <Chip size='sm' variant='primary'>当前版本</Chip>
            )}
            {isUpdate && (
              <Chip size='sm' variant='secondary'>
                <Download className='w-3 h-3' />
                可更新
              </Chip>
            )}
          </div>
          <div className='flex items-center gap-2 text-sm text-muted'>
            {entry.date}
          </div>
        </div>

        {/* 变更内容 */}
        <div className='space-y-3'>
          {entry.added.length > 0 && (
            <div>
              <h5 className='mb-2 flex items-center gap-1 text-sm font-medium text-success'>
                <Plus className='w-4 h-4' />
                新增功能
              </h5>
              <ul className='space-y-1'>
                {entry.added.map((item, index) => (
                  <li
                    key={index}
                    className='text-sm text-muted'
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {entry.changed.length > 0 && (
            <div>
              <h5 className='mb-2 flex items-center gap-1 text-sm font-medium text-accent'>
                <RefreshCw className='w-4 h-4' />
                功能改进
              </h5>
              <ul className='space-y-1'>
                {entry.changed.map((item, index) => (
                  <li
                    key={index}
                    className='text-sm text-muted'
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {entry.fixed.length > 0 && (
            <div>
              <h5 className='mb-2 flex items-center gap-1 text-sm font-medium text-danger'>
                <Bug className='w-4 h-4' />
                问题修复
              </h5>
              <ul className='space-y-1'>
                {entry.fixed.map((item, index) => (
                  <li
                    key={index}
                    className='text-sm text-muted'
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
    );
  };

  if (!mounted) return null;

  const remoteUpdates = remoteChangelog
    .filter((entry) => {
      const localVersions = changelog.map((local) => local.version);
      return !localVersions.includes(entry.version);
    })
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });

  return (
    <AppDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title='版本信息'
      description={`当前版本 v${CURRENT_VERSION}`}
      size='lg'
    >
      <div className='space-y-6'>
        {hasUpdate ? (
          <Alert status='warning'>
            <Alert.Indicator>
              <Download className='h-4 w-4' />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Title>发现新版本</Alert.Title>
              <Alert.Description>
                v{CURRENT_VERSION} {'->'} v{latestVersion}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        ) : (
          <Alert status='success'>
            <Alert.Indicator>
              <CheckCircle className='h-4 w-4' />
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Title>当前为最新版本</Alert.Title>
              <Alert.Description>已是最新版本 v{CURRENT_VERSION}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        <HeroLink href='https://github.com/djteang/OrangeTV' target='_blank'>
          前往仓库
        </HeroLink>

        {hasUpdate ? (
          <div className='space-y-4'>
            <div className='flex flex-col justify-between gap-3 sm:flex-row sm:items-center'>
              <h4 className='flex items-center gap-2 text-lg font-semibold text-foreground'>
                <Download className='h-5 w-5 text-warning' />
                远程更新内容
              </h4>
              <Button
                variant='secondary'
                size='sm'
                onPress={() => setShowRemoteContent(!showRemoteContent)}
              >
                {showRemoteContent ? (
                  <>
                    <ChevronUp className='h-4 w-4' />
                    收起
                  </>
                ) : (
                  <>
                    <ChevronDown className='h-4 w-4' />
                    查看更新内容
                  </>
                )}
              </Button>
            </div>

            {showRemoteContent && remoteUpdates.length > 0 ? (
              <div className='space-y-4'>
                {remoteUpdates.map((entry) =>
                  renderChangelogEntry(entry, false, true)
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <h4 className='text-lg font-semibold text-foreground'>变更日志</h4>
            <Chip size='sm' variant='secondary'>
              {changelog.length}
            </Chip>
          </div>
          {changelog.map((entry) =>
            renderChangelogEntry(entry, entry.version === CURRENT_VERSION, false)
          )}
        </div>
      </div>
    </AppDialog>
  );
};
