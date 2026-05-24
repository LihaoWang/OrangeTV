/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, no-console, @next/next/no-img-element */

'use client';

// Artplayer 和 Hls 以及弹幕插件将动态加载
import { Heart } from 'lucide-react';
import { Alert, Button, Card, Chip, ProgressBar, Spinner } from '@heroui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

import {
  deleteFavorite,
  deletePlayRecord,
  deleteSkipConfig,
  generateStorageKey,
  getAllPlayRecords,
  getSkipConfig,
  isFavorited,
  saveFavorite,
  savePlayRecord,
  saveSkipConfig,
  subscribeToDataUpdates,
} from '@/lib/db.client';
import { SearchResult } from '@/lib/types';
import { getVideoResolutionFromM3u8, processImageUrl } from '@/lib/utils';

import EpisodeSelector from '@/components/EpisodeSelector';
import PageLayout from '@/components/PageLayout';

// 扩展 HTMLVideoElement 类型以支持 hls 属性
declare global {
  interface HTMLVideoElement {
    hls?: any;
  }
}

// Wake Lock API 类型声明
interface WakeLockSentinel {
  released: boolean;
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
  removeEventListener(type: 'release', listener: () => void): void;
}

function PlayPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // -----------------------------------------------------------------------------
  // 状态变量（State）
  // -----------------------------------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState<
    'searching' | 'preferring' | 'fetching' | 'ready'
  >('searching');
  const [loadingMessage, setLoadingMessage] = useState('正在搜索播放源...');
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<SearchResult | null>(null);

  // 收藏状态
  const [favorited, setFavorited] = useState(false);

  // 跳过片头片尾配置
  const [skipConfig, setSkipConfig] = useState<{
    enable: boolean;
    intro_time: number;
    outro_time: number;
  }>({
    enable: false,
    intro_time: 0,
    outro_time: 0,
  });
  const skipConfigRef = useRef(skipConfig);
  useEffect(() => {
    skipConfigRef.current = skipConfig;
  }, [
    skipConfig,
    skipConfig.enable,
    skipConfig.intro_time,
    skipConfig.outro_time,
  ]);

  // 跳过检查的时间间隔控制
  const lastSkipCheckRef = useRef(0);

  // 去广告开关（从 localStorage 继承，默认 true）
  const [blockAdEnabled, setBlockAdEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const v = localStorage.getItem('enable_blockad');
      if (v !== null) return v === 'true';
    }
    return true;
  });
  const blockAdEnabledRef = useRef(blockAdEnabled);
  useEffect(() => {
    blockAdEnabledRef.current = blockAdEnabled;
  }, [blockAdEnabled]);

  // 视频基本信息
  const [videoTitle, setVideoTitle] = useState(searchParams.get('title') || '');
  const [videoYear, setVideoYear] = useState(searchParams.get('year') || '');
  const [videoCover, setVideoCover] = useState('');
  const [videoDoubanId, setVideoDoubanId] = useState(0);
  // 当前源和ID
  const [currentSource, setCurrentSource] = useState(
    searchParams.get('source') || ''
  );
  const [currentId, setCurrentId] = useState(searchParams.get('id') || '');

  // 短剧相关参数
  const [shortdramaId, setShortdramaId] = useState(
    searchParams.get('shortdrama_id') || ''
  );
  const [vodClass, setVodClass] = useState(
    searchParams.get('vod_class') || ''
  );
  const [vodTag, setVodTag] = useState(
    searchParams.get('vod_tag') || ''
  );

  // 搜索所需信息
  const [searchTitle] = useState(searchParams.get('stitle') || '');
  const [searchType] = useState(searchParams.get('stype') || '');

  // 是否需要优选
  const [needPrefer, setNeedPrefer] = useState(
    searchParams.get('prefer') === 'true'
  );

  // 动态加载的依赖
  const [dynamicDeps, setDynamicDeps] = useState<{
    Artplayer: any;
    Hls: any;
    artplayerPluginDanmuku: any;
  } | null>(null);

  // 弹幕相关状态
  const [danmuEnabled, setDanmuEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('enableDanmu');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });
  const needPreferRef = useRef(needPrefer);
  useEffect(() => {
    needPreferRef.current = needPrefer;
  }, [needPrefer]);

  // 动态加载 Artplayer、Hls 和弹幕插件
  useEffect(() => {
    let mounted = true;

    const loadDynamicDeps = async () => {
      try {
        const [ArtplayerModule, HlsModule, DanmakuModule] = await Promise.all([
          import('artplayer'),
          import('hls.js'),
          import('artplayer-plugin-danmuku')
        ]);

        if (mounted) {
          setDynamicDeps({
            Artplayer: ArtplayerModule.default,
            Hls: HlsModule.default,
            artplayerPluginDanmuku: DanmakuModule.default
          });
        }
      } catch (error) {
        console.error('加载播放器依赖失败:', error);
        if (mounted) {
          setError('播放器加载失败');
        }
      }
    };

    loadDynamicDeps();

    return () => {
      mounted = false;
    };
  }, []);
  // 集数相关
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);

  const currentSourceRef = useRef(currentSource);
  const currentIdRef = useRef(currentId);
  const videoTitleRef = useRef(videoTitle);
  const videoYearRef = useRef(videoYear);
  const detailRef = useRef<SearchResult | null>(detail);
  const currentEpisodeIndexRef = useRef(currentEpisodeIndex);
  const shortdramaIdRef = useRef(shortdramaId);
  const vodClassRef = useRef(vodClass);
  const vodTagRef = useRef(vodTag);

  // 同步最新值到 refs
  useEffect(() => {
    currentSourceRef.current = currentSource;
    currentIdRef.current = currentId;
    detailRef.current = detail;
    currentEpisodeIndexRef.current = currentEpisodeIndex;
    videoTitleRef.current = videoTitle;
    videoYearRef.current = videoYear;
    shortdramaIdRef.current = shortdramaId;
    vodClassRef.current = vodClass;
    vodTagRef.current = vodTag;
  }, [
    currentSource,
    currentId,
    detail,
    currentEpisodeIndex,
    videoTitle,
    videoYear,
    shortdramaId,
    vodClass,
    vodTag,
  ]);

  // 视频播放地址
  const [videoUrl, setVideoUrl] = useState('');

  // 总集数
  const totalEpisodes = detail?.episodes?.length || 0;

  // 用于记录是否需要在播放器 ready 后跳转到指定进度
  const resumeTimeRef = useRef<number | null>(null);
  // 上次使用的音量，默认 0.7
  const lastVolumeRef = useRef<number>(0.7);
  // 上次使用的播放速率，默认 1.0
  const lastPlaybackRateRef = useRef<number>(1.0);

  // 换源相关状态
  const [availableSources, setAvailableSources] = useState<SearchResult[]>([]);
  const [sourceSearchLoading, setSourceSearchLoading] = useState(false);
  const [sourceSearchError, setSourceSearchError] = useState<string | null>(
    null
  );

  // 优选和测速开关
  const [optimizationEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('enableOptimization');
      if (saved !== null) {
        try {
          return JSON.parse(saved);
        } catch {
          /* ignore */
        }
      }
    }
    return true;
  });

  // 保存优选时的测速结果，避免EpisodeSelector重复测速
  const [precomputedVideoInfo, setPrecomputedVideoInfo] = useState<
    Map<string, { quality: string; loadSpeed: string; pingTime: number }>
  >(new Map());

  // 折叠状态（仅在 lg 及以上屏幕有效）
  const [isEpisodeSelectorCollapsed, setIsEpisodeSelectorCollapsed] =
    useState(false);

  // 换源加载状态
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoLoadingStage, setVideoLoadingStage] = useState<
    'initing' | 'sourceChanging'
  >('initing');

  // 播放进度保存相关
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<number>(0);

  const artPlayerRef = useRef<any>(null);
  const artRef = useRef<HTMLDivElement | null>(null);

  // Wake Lock 相关
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // -----------------------------------------------------------------------------
  // 工具函数（Utils）
  // -----------------------------------------------------------------------------

  // 播放源优选函数
  const preferBestSource = async (
    sources: SearchResult[]
  ): Promise<SearchResult> => {
    if (sources.length === 1) return sources[0];

    // 将播放源均分为两批，并发测速各批，避免一次性过多请求
    const batchSize = Math.ceil(sources.length / 2);
    const allResults: Array<{
      source: SearchResult;
      testResult: { quality: string; loadSpeed: string; pingTime: number };
    } | null> = [];

    for (let start = 0; start < sources.length; start += batchSize) {
      const batchSources = sources.slice(start, start + batchSize);
      const batchResults = await Promise.all(
        batchSources.map(async (source) => {
          try {
            // 检查是否有第一集的播放地址
            if (!source.episodes || source.episodes.length === 0) {
              console.warn(`播放源 ${source.source_name} 没有可用的播放地址`);
              return null;
            }

            const episodeUrl =
              source.episodes.length > 1
                ? source.episodes[1]
                : source.episodes[0];
            const testResult = await getVideoResolutionFromM3u8(episodeUrl);

            return {
              source,
              testResult,
            };
          } catch (error) {
            return null;
          }
        })
      );
      allResults.push(...batchResults);
    }

    // 等待所有测速完成，包含成功和失败的结果
    // 保存所有测速结果到 precomputedVideoInfo，供 EpisodeSelector 使用（包含错误结果）
    const newVideoInfoMap = new Map<
      string,
      {
        quality: string;
        loadSpeed: string;
        pingTime: number;
        hasError?: boolean;
      }
    >();
    allResults.forEach((result, index) => {
      const source = sources[index];
      const sourceKey = `${source.source}-${source.id}`;

      if (result) {
        // 成功的结果
        newVideoInfoMap.set(sourceKey, result.testResult);
      }
    });

    // 过滤出成功的结果用于优选计算
    const successfulResults = allResults.filter(Boolean) as Array<{
      source: SearchResult;
      testResult: { quality: string; loadSpeed: string; pingTime: number };
    }>;

    setPrecomputedVideoInfo(newVideoInfoMap);

    if (successfulResults.length === 0) {
      console.warn('所有播放源测速都失败，使用第一个播放源');
      return sources[0];
    }

    // 找出所有有效速度的最大值，用于线性映射
    const validSpeeds = successfulResults
      .map((result) => {
        const speedStr = result.testResult.loadSpeed;
        if (speedStr === '未知' || speedStr === '测量中...') return 0;

        const match = speedStr.match(/^([\d.]+)\s*(KB\/s|MB\/s)$/);
        if (!match) return 0;

        const value = parseFloat(match[1]);
        const unit = match[2];
        return unit === 'MB/s' ? value * 1024 : value; // 统一转换为 KB/s
      })
      .filter((speed) => speed > 0);

    const maxSpeed = validSpeeds.length > 0 ? Math.max(...validSpeeds) : 1024; // 默认1MB/s作为基准

    // 找出所有有效延迟的最小值和最大值，用于线性映射
    const validPings = successfulResults
      .map((result) => result.testResult.pingTime)
      .filter((ping) => ping > 0);

    const minPing = validPings.length > 0 ? Math.min(...validPings) : 50;
    const maxPing = validPings.length > 0 ? Math.max(...validPings) : 1000;

    // 计算每个结果的评分
    const resultsWithScore = successfulResults.map((result) => ({
      ...result,
      score: calculateSourceScore(
        result.testResult,
        maxSpeed,
        minPing,
        maxPing
      ),
    }));

    // 按综合评分排序，选择最佳播放源
    resultsWithScore.sort((a, b) => b.score - a.score);

    console.log('播放源评分排序结果:');
    resultsWithScore.forEach((result, index) => {
      console.log(
        `${index + 1}. ${result.source.source_name
        } - 评分: ${result.score.toFixed(2)} (${result.testResult.quality}, ${result.testResult.loadSpeed
        }, ${result.testResult.pingTime}ms)`
      );
    });

    return resultsWithScore[0].source;
  };

  // 计算播放源综合评分
  const calculateSourceScore = (
    testResult: {
      quality: string;
      loadSpeed: string;
      pingTime: number;
    },
    maxSpeed: number,
    minPing: number,
    maxPing: number
  ): number => {
    let score = 0;

    // 分辨率评分 (40% 权重)
    const qualityScore = (() => {
      switch (testResult.quality) {
        case '4K':
          return 100;
        case '2K':
          return 85;
        case '1080p':
          return 75;
        case '720p':
          return 60;
        case '480p':
          return 40;
        case 'SD':
          return 20;
        default:
          return 0;
      }
    })();
    score += qualityScore * 0.4;

    // 下载速度评分 (40% 权重) - 基于最大速度线性映射
    const speedScore = (() => {
      const speedStr = testResult.loadSpeed;
      if (speedStr === '未知' || speedStr === '测量中...') return 30;

      // 解析速度值
      const match = speedStr.match(/^([\d.]+)\s*(KB\/s|MB\/s)$/);
      if (!match) return 30;

      const value = parseFloat(match[1]);
      const unit = match[2];
      const speedKBps = unit === 'MB/s' ? value * 1024 : value;

      // 基于最大速度线性映射，最高100分
      const speedRatio = speedKBps / maxSpeed;
      return Math.min(100, Math.max(0, speedRatio * 100));
    })();
    score += speedScore * 0.4;

    // 网络延迟评分 (20% 权重) - 基于延迟范围线性映射
    const pingScore = (() => {
      const ping = testResult.pingTime;
      if (ping <= 0) return 0; // 无效延迟给默认分

      // 如果所有延迟都相同，给满分
      if (maxPing === minPing) return 100;

      // 线性映射：最低延迟=100分，最高延迟=0分
      const pingRatio = (maxPing - ping) / (maxPing - minPing);
      return Math.min(100, Math.max(0, pingRatio * 100));
    })();
    score += pingScore * 0.2;

    return Math.round(score * 100) / 100; // 保留两位小数
  };

  // 更新视频地址
  const updateVideoUrl = (
    detailData: SearchResult | null,
    episodeIndex: number
  ) => {
    if (
      !detailData ||
      !detailData.episodes ||
      episodeIndex >= detailData.episodes.length
    ) {
      setVideoUrl('');
      return;
    }

    let newUrl = detailData?.episodes[episodeIndex] || '';

    // 如果是短剧且URL还没有经过代理处理，再次处理
    if (detailData.source === 'shortdrama' && newUrl && !newUrl.includes('/api/proxy/video')) {
      newUrl = processShortDramaUrl(newUrl);
      console.log('更新短剧播放地址:', {
        episode: episodeIndex + 1,
        originalUrl: detailData.episodes[episodeIndex],
        processedUrl: newUrl
      });
    }

    if (newUrl !== videoUrl) {
      setVideoUrl(newUrl);
    }
  };

  const ensureVideoSource = (video: HTMLVideoElement | null, url: string) => {
    if (!video || !url) return;
    const sources = Array.from(video.getElementsByTagName('source'));
    const existed = sources.some((s) => s.src === url);
    if (!existed) {
      // 移除旧的 source，保持唯一
      sources.forEach((s) => s.remove());
      const sourceEl = document.createElement('source');
      sourceEl.src = url;
      video.appendChild(sourceEl);
    }

    // 始终允许远程播放（AirPlay / Cast）
    video.disableRemotePlayback = false;
    // 如果曾经有禁用属性，移除之
    if (video.hasAttribute('disableRemotePlayback')) {
      video.removeAttribute('disableRemotePlayback');
    }
  };

  // Wake Lock 相关函数
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request(
          'screen'
        );
        console.log('Wake Lock 已启用');
      }
    } catch (err) {
      console.warn('Wake Lock 请求失败:', err);
    }
  };

  const releaseWakeLock = async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Wake Lock 已释放');
      }
    } catch (err) {
      console.warn('Wake Lock 释放失败:', err);
    }
  };

  // 清理播放器资源的统一函数
  const cleanupPlayer = () => {
    if (artPlayerRef.current) {
      try {
        // 销毁 HLS 实例
        if (artPlayerRef.current.video && artPlayerRef.current.video.hls) {
          artPlayerRef.current.video.hls.destroy();
        }

        // 销毁 ArtPlayer 实例
        artPlayerRef.current.destroy();
        artPlayerRef.current = null;

        console.log('播放器资源已清理');
      } catch (err) {
        console.warn('清理播放器资源时出错:', err);
        artPlayerRef.current = null;
      }
    }
  };

  // 去广告相关函数
  function filterAdsFromM3U8(m3u8Content: string): string {
    if (!m3u8Content) return '';

    // 按行分割M3U8内容
    const lines = m3u8Content.split('\n');
    const filteredLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 只过滤#EXT-X-DISCONTINUITY标识
      if (!line.includes('#EXT-X-DISCONTINUITY')) {
        filteredLines.push(line);
      }
    }

    return filteredLines.join('\n');
  }

  // 跳过片头片尾配置相关函数
  const handleSkipConfigChange = async (newConfig: {
    enable: boolean;
    intro_time: number;
    outro_time: number;
  }) => {
    if (!currentSourceRef.current || !currentIdRef.current) return;

    try {
      setSkipConfig(newConfig);
      if (!newConfig.enable && !newConfig.intro_time && !newConfig.outro_time) {
        await deleteSkipConfig(currentSourceRef.current, currentIdRef.current);
        artPlayerRef.current.setting.update({
          name: '跳过片头片尾',
          html: '跳过片头片尾',
          switch: skipConfigRef.current.enable,
          onSwitch: function (item: any) {
            const newConfig = {
              ...skipConfigRef.current,
              enable: !item.switch,
            };
            handleSkipConfigChange(newConfig);
            return !item.switch;
          },
        });
        artPlayerRef.current.setting.update({
          name: '设置片头',
          html: '设置片头',
          icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="12" r="2" fill="#ffffff"/><path d="M9 12L17 12" stroke="#ffffff" stroke-width="2"/><path d="M17 6L17 18" stroke="#ffffff" stroke-width="2"/></svg>',
          tooltip:
            skipConfigRef.current.intro_time === 0
              ? '设置片头时间'
              : `${formatTime(skipConfigRef.current.intro_time)}`,
          onClick: function () {
            const currentTime = artPlayerRef.current?.currentTime || 0;
            if (currentTime > 0) {
              const newConfig = {
                ...skipConfigRef.current,
                intro_time: currentTime,
              };
              handleSkipConfigChange(newConfig);
              return `${formatTime(currentTime)}`;
            }
          },
        });
        artPlayerRef.current.setting.update({
          name: '设置片尾',
          html: '设置片尾',
          icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 6L7 18" stroke="#ffffff" stroke-width="2"/><path d="M7 12L15 12" stroke="#ffffff" stroke-width="2"/><circle cx="19" cy="12" r="2" fill="#ffffff"/></svg>',
          tooltip:
            skipConfigRef.current.outro_time >= 0
              ? '设置片尾时间'
              : `-${formatTime(-skipConfigRef.current.outro_time)}`,
          onClick: function () {
            const outroTime =
              -(
                artPlayerRef.current?.duration -
                artPlayerRef.current?.currentTime
              ) || 0;
            if (outroTime < 0) {
              const newConfig = {
                ...skipConfigRef.current,
                outro_time: outroTime,
              };
              handleSkipConfigChange(newConfig);
              return `-${formatTime(-outroTime)}`;
            }
          },
        });
      } else {
        await saveSkipConfig(
          currentSourceRef.current,
          currentIdRef.current,
          newConfig
        );
      }
      console.log('跳过片头片尾配置已保存:', newConfig);
    } catch (err) {
      console.error('保存跳过片头片尾配置失败:', err);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds === 0) return '00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.round(seconds % 60);

    if (hours === 0) {
      // 不到一小时，格式为 00:00
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
        .toString()
        .padStart(2, '0')}`;
    } else {
      // 超过一小时，格式为 00:00:00
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  // 弹幕相关函数
  const generateVideoId = (source: string, id: string, episode: number): string => {
    return `${source}_${id}_${episode}`;
  };

  // 短剧标签处理函数
  const parseVodTags = (vodTagString: string): string[] => {
    if (!vodTagString) return [];
    return vodTagString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  };

  // 短剧播放地址处理函数 - 参考utils.ts中的代理逻辑
  const processShortDramaUrl = (originalUrl: string): string => {
    if (!originalUrl) {
      console.warn('🚫 [URL处理] 原始URL为空');
      return originalUrl;
    }

    console.log('🔗 [URL处理] 开始处理短剧播放地址:', {
      originalUrl: originalUrl.substring(0, 120) + (originalUrl.length > 120 ? '...' : ''),
      urlLength: originalUrl.length,
      protocol: originalUrl.split('://')[0] || 'unknown',
      domain: originalUrl.match(/https?:\/\/([^\/]+)/)?.[1] || 'unknown'
    });

    // 检查是否需要使用代理 - 参考utils.ts中的逻辑
    const proxyChecks = {
      'quark.cn': originalUrl.includes('quark.cn'),
      'drive.quark.cn': originalUrl.includes('drive.quark.cn'),
      'dl-c-zb-': originalUrl.includes('dl-c-zb-'),
      'dl-c-': originalUrl.includes('dl-c-'),
      'drive pattern': !!originalUrl.match(/https?:\/\/[^/]*\.drive\./),
      'ffzy-online': originalUrl.includes('ffzy-online'),
      'bfikuncdn.com': originalUrl.includes('bfikuncdn.com'),
      'vip.': originalUrl.includes('vip.'),
      'm3u8': originalUrl.includes('m3u8'),
      'not localhost': !originalUrl.includes('localhost') && !originalUrl.includes('127.0.0.1')
    };

    const needsProxy = Object.values(proxyChecks).some(check => check);
    const triggeredChecks = Object.entries(proxyChecks).filter(([, check]) => check).map(([name]) => name);

    console.log('🔍 [URL处理] 代理检查结果:', {
      needsProxy,
      triggeredChecks,
      proxyChecks
    });

    if (needsProxy) {
      const proxyUrl = `/api/proxy/video?url=${encodeURIComponent(originalUrl)}`;
      console.log('🎯 [URL处理] 短剧播放地址需要代理:', {
        originalUrl: originalUrl.substring(0, 100) + '...',
        proxyUrl: proxyUrl.substring(0, 100) + '...',
        triggeredChecks,
        encodedLength: encodeURIComponent(originalUrl).length
      });
      return proxyUrl;
    }

    console.log('✅ [URL处理] 短剧播放地址直接使用:', {
      url: originalUrl.substring(0, 100) + (originalUrl.length > 100 ? '...' : ''),
      reason: '不满足代理条件'
    });
    return originalUrl;
  };

  // 短剧数据获取和转换函数
  const fetchShortDramaData = async (shortdramaId: string): Promise<SearchResult> => {
    try {
      console.log('🎬 [短剧API] 开始获取短剧数据');
      console.log('🔍 [短剧API] 请求参数:', {
        shortdramaId: shortdramaId,
        requestUrl: `/api/shortdrama/parse/all?id=${encodeURIComponent(shortdramaId)}`,
        timestamp: new Date().toISOString()
      });

      const requestStartTime = performance.now();

      const response = await fetch(`/api/shortdrama/parse/all?id=${encodeURIComponent(shortdramaId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const requestEndTime = performance.now();
      const requestDuration = requestEndTime - requestStartTime;

      console.log('📡 [短剧API] 响应状态:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        requestDuration: `${requestDuration.toFixed(2)}ms`
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [短剧API] 响应错误:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          url: `/api/shortdrama/parse/all?id=${encodeURIComponent(shortdramaId)}`
        });
        throw new Error(`获取短剧数据失败: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 [短剧API] 响应数据结构:', {
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
        videoId: data?.videoId,
        videoName: data?.videoName,
        hasResults: !!data?.results,
        resultsLength: data?.results?.length || 0,
        totalEpisodes: data?.totalEpisodes,
        successfulCount: data?.successfulCount,
        failedCount: data?.failedCount,
        hasCover: !!data?.cover,
        hasDescription: !!data?.description
      });

      // 详细打印 results 数组的结构
      if (data?.results && Array.isArray(data.results)) {
        console.log('📋 [短剧API] Results数组详情:', {
          totalCount: data.results.length,
          sample: data.results.slice(0, 3).map((item: any) => ({
            index: item.index,
            label: item.label,
            status: item.status,
            hasParsedUrl: !!item.parsedUrl,
            parsedUrlType: typeof item.parsedUrl,
            parsedUrlLength: item.parsedUrl ? item.parsedUrl.length : 0,
            parseInfo: item.parseInfo ? Object.keys(item.parseInfo) : null,
            reason: item.reason
          }))
        });
      } else {
        console.error('❌ [短剧API] Results数组无效:', {
          results: data?.results,
          resultsType: typeof data?.results,
          isArray: Array.isArray(data?.results)
        });
      }

      // 检查数据有效性
      if (!data) {
        console.error('❌ [短剧API] 数据为空');
        throw new Error('短剧数据为空');
      }

      console.log('🔄 [短剧处理] 开始转换数据为SearchResult格式');

      // 将短剧数据转换为SearchResult格式
      const episodes: string[] = [];
      const episodesTitles: string[] = [];
      const processingLog: any[] = [];

      if (data.results && Array.isArray(data.results)) {
        console.log('📝 [短剧处理] 处理播放源数据:', {
          totalCount: data.results.length,
          validCount: data.results.filter((item: any) => item.status === 'success').length,
          failedCount: data.results.filter((item: any) => item.status !== 'success').length
        });

        // 按index排序确保集数顺序正确
        const sortedResults = data.results.sort((a: any, b: any) => {
          const indexA = parseInt(a.index) || 0;
          const indexB = parseInt(b.index) || 0;
          return indexA - indexB;
        });

        console.log('🔢 [短剧处理] 排序后的集数范围:', {
          minIndex: sortedResults[0]?.index,
          maxIndex: sortedResults[sortedResults.length - 1]?.index,
          firstLabel: sortedResults[0]?.label,
          lastLabel: sortedResults[sortedResults.length - 1]?.label
        });

        sortedResults.forEach((item: any, arrayIndex: number) => {
          const itemLog: any = {
            arrayIndex,
            index: item.index,
            label: item.label,
            status: item.status,
            hasUrl: !!item.parsedUrl,
            urlLength: item.parsedUrl ? item.parsedUrl.length : 0,
            reason: item.reason
          };

          if (item.status === 'success' && item.parsedUrl) {
            console.log(`✅ [短剧处理] 处理第 ${arrayIndex + 1} 个数据项:`, {
              index: item.index,
              label: item.label,
              originalUrl: item.parsedUrl.substring(0, 100) + (item.parsedUrl.length > 100 ? '...' : ''),
              urlDomain: item.parsedUrl.match(/https?:\/\/([^\/]+)/)?.[1] || 'unknown'
            });

            // 处理播放地址，添加代理支持
            const processedUrl = processShortDramaUrl(item.parsedUrl);
            episodes.push(processedUrl);

            // 使用API提供的label，如果没有则根据索引生成
            const episodeTitle = item.label || `第${(item.index !== undefined ? item.index + 1 : arrayIndex + 1)}集`;
            episodesTitles.push(episodeTitle);

            console.log(`📺 [短剧处理] 成功添加集数 ${episodes.length}:`, {
              title: episodeTitle,
              originalUrl: item.parsedUrl.substring(0, 80) + '...',
              processedUrl: processedUrl.substring(0, 80) + '...',
              needsProxy: processedUrl.includes('/api/proxy/video')
            });

            itemLog.processed = true;
            itemLog.needsProxy = processedUrl.includes('/api/proxy/video');
          } else {
            console.warn(`⚠️ [短剧处理] 跳过无效的播放源:`, {
              index: item.index,
              label: item.label,
              status: item.status,
              hasUrl: !!item.parsedUrl,
              reason: item.reason,
              fullItem: item
            });
            itemLog.processed = false;
            itemLog.skipReason = `状态: ${item.status}, 有URL: ${!!item.parsedUrl}`;
          }

          processingLog.push(itemLog);
        });

        console.log('📊 [短剧处理] 数据处理统计:', {
          totalProcessed: processingLog.length,
          successfulEpisodes: episodes.length,
          failedItems: processingLog.filter((item: any) => !item.processed).length,
          processingDetails: processingLog
        });
      } else {
        console.error('❌ [短剧处理] Results数组无效或为空:', {
          hasResults: !!data.results,
          resultsType: typeof data.results,
          isArray: Array.isArray(data.results),
          rawResults: data.results
        });
      }

      if (episodes.length === 0) {
        console.error('❌ [短剧处理] 没有找到有效的播放地址:', {
          originalDataResults: data.results?.length || 0,
          validResults: data.results?.filter((item: any) => item.status === 'success')?.length || 0,
          withUrls: data.results?.filter((item: any) => item.status === 'success' && item.parsedUrl)?.length || 0,
          processingLog
        });
        throw new Error('未找到可播放的视频源，请稍后重试');
      }

      console.log('🎯 [短剧处理] 构建SearchResult对象');

      const searchResult: SearchResult = {
        source: 'shortdrama',
        id: shortdramaId,
        title: data.videoName || videoTitle || '短剧播放',
        poster: data.cover || '',
        year: videoYear || new Date().getFullYear().toString(),
        source_name: '短剧',
        type_name: '短剧',
        class: '短剧',
        episodes: episodes,
        episodes_titles: episodesTitles,
        desc: data.description || '精彩短剧，为您呈现优质内容',
        douban_id: 0
      };

      console.log('✅ [短剧处理] 转换完成的短剧数据:', {
        source: searchResult.source,
        id: searchResult.id,
        title: searchResult.title,
        totalEpisodes: searchResult.episodes.length,
        episodesTitles: searchResult.episodes_titles,
        firstEpisodeUrl: searchResult.episodes[0]?.substring(0, 100) + '...',
        lastEpisodeUrl: searchResult.episodes[searchResult.episodes.length - 1]?.substring(0, 100) + '...',
        poster: searchResult.poster,
        year: searchResult.year,
        desc: searchResult.desc?.substring(0, 100) + '...'
      });

      console.log('🔗 [短剧处理] 播放地址列表预览:');
      episodes.slice(0, 5).forEach((url, index) => {
        console.log(`  ${index + 1}. ${episodesTitles[index]} - ${url.substring(0, 120)}${url.length > 120 ? '...' : ''}`);
      });
      if (episodes.length > 5) {
        console.log(`  ... 还有 ${episodes.length - 5} 个播放地址`);
      }

      return searchResult;
    } catch (error) {
      console.error('❌ [短剧处理] 获取短剧数据失败:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        shortdramaId: shortdramaId,
        timestamp: new Date().toISOString()
      });

      // 提供更详细的错误信息
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络设置后重试');
      } else if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('短剧数据加载失败，请稍后重试');
      }
    }
  };

  const loadDanmuData = async (videoId: string) => {
    try {
      const response = await fetch(`/api/danmu?videoId=${encodeURIComponent(videoId)}`);
      if (!response.ok) {
        throw new Error('获取弹幕数据失败');
      }
      return await response.json();
    } catch (error) {
      console.error('加载弹幕失败:', error);
      return [];
    }
  };

  const sendDanmu = async (videoId: string, danmuData: any) => {
    try {
      const response = await fetch('/api/danmu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          ...danmuData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '发送弹幕失败');
      }

      return await response.json();
    } catch (error) {
      console.error('发送弹幕失败:', error);
      throw error;
    }
  };

  const createCustomHlsJsLoader = (Hls: any) => {
    return class extends Hls.DefaultConfig.loader {
      constructor(config: any) {
        super(config);
        const load = this.load.bind(this);
        this.load = function (context: any, config: any, callbacks: any) {
          // 拦截manifest和level请求
          if (
            (context as any).type === 'manifest' ||
            (context as any).type === 'level'
          ) {
            const onSuccess = callbacks.onSuccess;
            callbacks.onSuccess = function (
              response: any,
              stats: any,
              context: any
            ) {
              // 如果是m3u8文件，处理内容以移除广告分段
              if (response.data && typeof response.data === 'string') {
                // 过滤掉广告段 - 实现更精确的广告过滤逻辑
                response.data = filterAdsFromM3U8(response.data);
              }
              return onSuccess(response, stats, context, null);
            };
          }
          // 执行原始load方法
          load(context, config, callbacks);
        };
      };
    };
  }

  // 当集数索引变化时自动更新视频地址
  useEffect(() => {
    updateVideoUrl(detail, currentEpisodeIndex);
  }, [detail, currentEpisodeIndex]);

  // 进入页面时直接获取全部源信息
  useEffect(() => {
    const fetchSourceDetail = async (
      source: string,
      id: string
    ): Promise<SearchResult[]> => {
      try {
        const detailResponse = await fetch(
          `/api/detail?source=${source}&id=${id}`
        );
        if (!detailResponse.ok) {
          throw new Error('获取视频详情失败');
        }
        const detailData = (await detailResponse.json()) as SearchResult;
        setAvailableSources([detailData]);
        return [detailData];
      } catch (err) {
        console.error('获取视频详情失败:', err);
        return [];
      } finally {
        setSourceSearchLoading(false);
      }
    };
    const fetchSourcesData = async (query: string): Promise<SearchResult[]> => {
      // 根据搜索词获取全部源信息
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`
        );
        if (!response.ok) {
          throw new Error('搜索失败');
        }
        const data = await response.json();

        // 处理搜索结果，根据规则过滤
        const results = data.results.filter(
          (result: SearchResult) =>
            result.title.replaceAll(' ', '').toLowerCase() ===
            videoTitleRef.current.replaceAll(' ', '').toLowerCase() &&
            (videoYearRef.current
              ? result.year.toLowerCase() === videoYearRef.current.toLowerCase()
              : true) &&
            (searchType
              ? (searchType === 'tv' && result.episodes.length > 1) ||
              (searchType === 'movie' && result.episodes.length === 1)
              : true)
        );
        setAvailableSources(results);
        return results;
      } catch (err) {
        setSourceSearchError(err instanceof Error ? err.message : '搜索失败');
        setAvailableSources([]);
        return [];
      } finally {
        setSourceSearchLoading(false);
      }
    };

    const initAll = async () => {
      // 检查是否为短剧播放
      if (shortdramaId) {
        try {
          setLoading(true);
          setLoadingStage('fetching');
          setLoadingMessage('🎬 正在获取短剧播放信息...');

          const shortDramaData = await fetchShortDramaData(shortdramaId);

          setCurrentSource(shortDramaData.source);
          setCurrentId(shortDramaData.id);
          setVideoTitle(shortDramaData.title);
          setVideoYear(shortDramaData.year);
          setVideoCover(shortDramaData.poster);
          setVideoDoubanId(shortDramaData.douban_id || 0);
          setDetail(shortDramaData);
          setAvailableSources([shortDramaData]);

          if (currentEpisodeIndex >= shortDramaData.episodes.length) {
            setCurrentEpisodeIndex(0);
          }

          // 规范URL参数
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('source', shortDramaData.source);
          newUrl.searchParams.set('id', shortDramaData.id);
          newUrl.searchParams.set('title', shortDramaData.title);
          newUrl.searchParams.set('year', shortDramaData.year);
          window.history.replaceState({}, '', newUrl.toString());

          setLoadingStage('ready');
          setLoadingMessage('✨ 短剧准备就绪，即将开始播放...');

          // 短暂延迟让用户看到完成状态
          setTimeout(() => {
            setLoading(false);
          }, 1000);

          return;
        } catch (error) {
          console.error('短剧初始化失败:', error);

          // 提供更详细和用户友好的错误信息
          let errorMessage = '短剧加载失败';

          if (error instanceof Error) {
            if (error.message.includes('网络')) {
              errorMessage = '网络连接失败，请检查网络设置后重试';
            } else if (error.message.includes('未找到')) {
              errorMessage = '未找到该短剧的播放资源，可能已被移除';
            } else if (error.message.includes('数据为空')) {
              errorMessage = '短剧数据异常，请稍后重试';
            } else if (error.message.includes('超时')) {
              errorMessage = '请求超时，请检查网络后重试';
            } else {
              errorMessage = error.message;
            }
          }

          setError(errorMessage);
          setLoading(false);
          return;
        }
      }

      if (!currentSource && !currentId && !videoTitle && !searchTitle) {
        setError('缺少必要参数');
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadingStage(currentSource && currentId ? 'fetching' : 'searching');
      setLoadingMessage(
        currentSource && currentId
          ? '🎬 正在获取视频详情...'
          : '🔍 正在搜索播放源...'
      );

      let sourcesInfo = await fetchSourcesData(searchTitle || videoTitle);
      if (
        currentSource &&
        currentId &&
        !sourcesInfo.some(
          (source) => source.source === currentSource && source.id === currentId
        )
      ) {
        sourcesInfo = await fetchSourceDetail(currentSource, currentId);
      }
      if (sourcesInfo.length === 0) {
        setError('未找到匹配结果');
        setLoading(false);
        return;
      }

      let detailData: SearchResult = sourcesInfo[0];
      // 指定源和id且无需优选
      if (currentSource && currentId && !needPreferRef.current) {
        const target = sourcesInfo.find(
          (source) => source.source === currentSource && source.id === currentId
        );
        if (target) {
          detailData = target;
        } else {
          setError('未找到匹配结果');
          setLoading(false);
          return;
        }
      }

      // 未指定源和 id 或需要优选，且开启优选开关
      if (
        (!currentSource || !currentId || needPreferRef.current) &&
        optimizationEnabled
      ) {
        setLoadingStage('preferring');
        setLoadingMessage('⚡ 正在优选最佳播放源...');

        detailData = await preferBestSource(sourcesInfo);
      }

      console.log(detailData.source, detailData.id);

      setNeedPrefer(false);
      setCurrentSource(detailData.source);
      setCurrentId(detailData.id);
      setVideoYear(detailData.year);
      setVideoTitle(detailData.title || videoTitleRef.current);
      setVideoCover(detailData.poster);
      setVideoDoubanId(detailData.douban_id || 0);
      setDetail(detailData);
      if (currentEpisodeIndex >= detailData.episodes.length) {
        setCurrentEpisodeIndex(0);
      }

      // 规范URL参数
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('source', detailData.source);
      newUrl.searchParams.set('id', detailData.id);
      newUrl.searchParams.set('year', detailData.year);
      newUrl.searchParams.set('title', detailData.title);
      newUrl.searchParams.delete('prefer');
      window.history.replaceState({}, '', newUrl.toString());

      setLoadingStage('ready');
      setLoadingMessage('✨ 准备就绪，即将开始播放...');

      // 短暂延迟让用户看到完成状态
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    };

    initAll();
  }, [shortdramaId]);

  // 播放记录处理
  useEffect(() => {
    // 仅在初次挂载时检查播放记录
    const initFromHistory = async () => {
      if (!currentSource || !currentId) return;

      try {
        const allRecords = await getAllPlayRecords();
        const key = generateStorageKey(currentSource, currentId);
        const record = allRecords[key];

        if (record) {
          const targetIndex = record.index - 1;
          const targetTime = record.play_time;

          // 更新当前选集索引
          if (targetIndex !== currentEpisodeIndex) {
            setCurrentEpisodeIndex(targetIndex);
          }

          // 保存待恢复的播放进度，待播放器就绪后跳转
          resumeTimeRef.current = targetTime;
        }
      } catch (err) {
        console.error('读取播放记录失败:', err);
      }
    };

    initFromHistory();
  }, []);

  // 跳过片头片尾配置处理
  useEffect(() => {
    // 仅在初次挂载时检查跳过片头片尾配置
    const initSkipConfig = async () => {
      if (!currentSource || !currentId) return;

      try {
        const config = await getSkipConfig(currentSource, currentId);
        if (config) {
          setSkipConfig(config);
        }
      } catch (err) {
        console.error('读取跳过片头片尾配置失败:', err);
      }
    };

    initSkipConfig();
  }, []);

  // 处理换源
  const handleSourceChange = async (
    newSource: string,
    newId: string,
    newTitle: string
  ) => {
    try {
      // 显示换源加载状态
      setVideoLoadingStage('sourceChanging');
      setIsVideoLoading(true);

      // 记录当前播放进度（仅在同一集数切换时恢复）
      const currentPlayTime = artPlayerRef.current?.currentTime || 0;
      console.log('换源前当前播放时间:', currentPlayTime);

      // 清除前一个历史记录
      if (currentSourceRef.current && currentIdRef.current) {
        try {
          await deletePlayRecord(
            currentSourceRef.current,
            currentIdRef.current
          );
          console.log('已清除前一个播放记录');
        } catch (err) {
          console.error('清除播放记录失败:', err);
        }
      }

      // 清除并设置下一个跳过片头片尾配置
      if (currentSourceRef.current && currentIdRef.current) {
        try {
          await deleteSkipConfig(
            currentSourceRef.current,
            currentIdRef.current
          );
          await saveSkipConfig(newSource, newId, skipConfigRef.current);
        } catch (err) {
          console.error('清除跳过片头片尾配置失败:', err);
        }
      }

      const newDetail = availableSources.find(
        (source) => source.source === newSource && source.id === newId
      );
      if (!newDetail) {
        setError('未找到匹配结果');
        return;
      }

      // 尝试跳转到当前正在播放的集数
      let targetIndex = currentEpisodeIndex;

      // 如果当前集数超出新源的范围，则跳转到第一集
      if (!newDetail.episodes || targetIndex >= newDetail.episodes.length) {
        targetIndex = 0;
      }

      // 如果仍然是同一集数且播放进度有效，则在播放器就绪后恢复到原始进度
      if (targetIndex !== currentEpisodeIndex) {
        resumeTimeRef.current = 0;
      } else if (
        (!resumeTimeRef.current || resumeTimeRef.current === 0) &&
        currentPlayTime > 1
      ) {
        resumeTimeRef.current = currentPlayTime;
      }

      // 更新URL参数（不刷新页面）
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('source', newSource);
      newUrl.searchParams.set('id', newId);
      newUrl.searchParams.set('year', newDetail.year);
      window.history.replaceState({}, '', newUrl.toString());

      setVideoTitle(newDetail.title || newTitle);
      setVideoYear(newDetail.year);
      setVideoCover(newDetail.poster);
      setVideoDoubanId(newDetail.douban_id || 0);
      setCurrentSource(newSource);
      setCurrentId(newId);
      setDetail(newDetail);
      setCurrentEpisodeIndex(targetIndex);
    } catch (err) {
      // 隐藏换源加载状态
      setIsVideoLoading(false);
      setError(err instanceof Error ? err.message : '换源失败');
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // 集数切换
  // ---------------------------------------------------------------------------
  // 处理集数切换
  const handleEpisodeChange = (episodeNumber: number) => {
    if (episodeNumber >= 0 && episodeNumber < totalEpisodes) {
      // 在更换集数前保存当前播放进度
      if (artPlayerRef.current && artPlayerRef.current.paused) {
        saveCurrentPlayProgress();
      }
      setCurrentEpisodeIndex(episodeNumber);
    }
  };

  const handlePreviousEpisode = () => {
    const d = detailRef.current;
    const idx = currentEpisodeIndexRef.current;
    if (d && d.episodes && idx > 0) {
      if (artPlayerRef.current && !artPlayerRef.current.paused) {
        saveCurrentPlayProgress();
      }
      setCurrentEpisodeIndex(idx - 1);
    }
  };

  const handleNextEpisode = () => {
    const d = detailRef.current;
    const idx = currentEpisodeIndexRef.current;
    if (d && d.episodes && idx < d.episodes.length - 1) {
      if (artPlayerRef.current && !artPlayerRef.current.paused) {
        saveCurrentPlayProgress();
      }
      setCurrentEpisodeIndex(idx + 1);
    }
  };

  // ---------------------------------------------------------------------------
  // 键盘快捷键
  // ---------------------------------------------------------------------------
  // 处理全局快捷键
  const handleKeyboardShortcuts = (e: KeyboardEvent) => {
    // 忽略输入框中的按键事件
    if (
      (e.target as HTMLElement).tagName === 'INPUT' ||
      (e.target as HTMLElement).tagName === 'TEXTAREA'
    )
      return;

    // Alt + 左箭头 = 上一集
    if (e.altKey && e.key === 'ArrowLeft') {
      if (detailRef.current && currentEpisodeIndexRef.current > 0) {
        handlePreviousEpisode();
        e.preventDefault();
      }
    }

    // Alt + 右箭头 = 下一集
    if (e.altKey && e.key === 'ArrowRight') {
      const d = detailRef.current;
      const idx = currentEpisodeIndexRef.current;
      if (d && idx < d.episodes.length - 1) {
        handleNextEpisode();
        e.preventDefault();
      }
    }

    // 左箭头 = 快退
    if (!e.altKey && e.key === 'ArrowLeft') {
      if (artPlayerRef.current && artPlayerRef.current.currentTime > 5) {
        artPlayerRef.current.currentTime -= 10;
        e.preventDefault();
      }
    }

    // 右箭头 = 快进
    if (!e.altKey && e.key === 'ArrowRight') {
      if (
        artPlayerRef.current &&
        artPlayerRef.current.currentTime < artPlayerRef.current.duration - 5
      ) {
        artPlayerRef.current.currentTime += 10;
        e.preventDefault();
      }
    }

    // 上箭头 = 音量+
    if (e.key === 'ArrowUp') {
      if (artPlayerRef.current && artPlayerRef.current.volume < 1) {
        artPlayerRef.current.volume =
          Math.round((artPlayerRef.current.volume + 0.1) * 10) / 10;
        artPlayerRef.current.notice.show = `音量: ${Math.round(
          artPlayerRef.current.volume * 100
        )}`;
        e.preventDefault();
      }
    }

    // 下箭头 = 音量-
    if (e.key === 'ArrowDown') {
      if (artPlayerRef.current && artPlayerRef.current.volume > 0) {
        artPlayerRef.current.volume =
          Math.round((artPlayerRef.current.volume - 0.1) * 10) / 10;
        artPlayerRef.current.notice.show = `音量: ${Math.round(
          artPlayerRef.current.volume * 100
        )}`;
        e.preventDefault();
      }
    }

    // 空格 = 播放/暂停
    if (e.key === ' ') {
      if (artPlayerRef.current) {
        artPlayerRef.current.toggle();
        e.preventDefault();
      }
    }

    // f 键 = 切换全屏
    if (e.key === 'f' || e.key === 'F') {
      if (artPlayerRef.current) {
        artPlayerRef.current.fullscreen = !artPlayerRef.current.fullscreen;
        e.preventDefault();
      }
    }
  };

  // ---------------------------------------------------------------------------
  // 播放记录相关
  // ---------------------------------------------------------------------------
  // 保存播放进度
  const saveCurrentPlayProgress = async () => {
    if (
      !artPlayerRef.current ||
      !currentSourceRef.current ||
      !currentIdRef.current ||
      !videoTitleRef.current ||
      !detailRef.current?.source_name
    ) {
      return;
    }

    const player = artPlayerRef.current;
    const currentTime = player.currentTime || 0;
    const duration = player.duration || 0;

    // 如果播放时间太短（少于5秒）或者视频时长无效，不保存
    if (currentTime < 1 || !duration) {
      return;
    }

    try {
      await savePlayRecord(currentSourceRef.current, currentIdRef.current, {
        title: videoTitleRef.current,
        source_name: detailRef.current?.source_name || '',
        year: detailRef.current?.year,
        cover: detailRef.current?.poster || '',
        index: currentEpisodeIndexRef.current + 1, // 转换为1基索引
        total_episodes: detailRef.current?.episodes.length || 1,
        play_time: Math.floor(currentTime),
        total_time: Math.floor(duration),
        save_time: Date.now(),
        search_title: searchTitle,
      });

      lastSaveTimeRef.current = Date.now();
      console.log('播放进度已保存:', {
        title: videoTitleRef.current,
        episode: currentEpisodeIndexRef.current + 1,
        year: detailRef.current?.year,
        progress: `${Math.floor(currentTime)}/${Math.floor(duration)}`,
      });
    } catch (err) {
      console.error('保存播放进度失败:', err);
    }
  };

  useEffect(() => {
    // 页面即将卸载时保存播放进度和清理资源
    const handleBeforeUnload = () => {
      saveCurrentPlayProgress();
      releaseWakeLock();
      cleanupPlayer();
    };

    // 页面可见性变化时保存播放进度和释放 Wake Lock
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveCurrentPlayProgress();
        releaseWakeLock();
      } else if (document.visibilityState === 'visible') {
        // 页面重新可见时，如果正在播放则重新请求 Wake Lock
        if (artPlayerRef.current && !artPlayerRef.current.paused) {
          requestWakeLock();
        }
      }
    };

    // 添加事件监听器
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // 清理事件监听器
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentEpisodeIndex, detail, artPlayerRef.current]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // 收藏相关
  // ---------------------------------------------------------------------------
  // 每当 source 或 id 变化时检查收藏状态
  useEffect(() => {
    if (!currentSource || !currentId) return;
    (async () => {
      try {
        const fav = await isFavorited(currentSource, currentId);
        setFavorited(fav);
      } catch (err) {
        console.error('检查收藏状态失败:', err);
      }
    })();
  }, [currentSource, currentId]);

  // 监听收藏数据更新事件
  useEffect(() => {
    if (!currentSource || !currentId) return;

    const unsubscribe = subscribeToDataUpdates(
      'favoritesUpdated',
      (favorites: Record<string, any>) => {
        const key = generateStorageKey(currentSource, currentId);
        const isFav = !!favorites[key];
        setFavorited(isFav);
      }
    );

    return unsubscribe;
  }, [currentSource, currentId]);

  // 切换收藏
  const handleToggleFavorite = async () => {
    if (
      !videoTitleRef.current ||
      !detailRef.current ||
      !currentSourceRef.current ||
      !currentIdRef.current
    )
      return;

    try {
      if (favorited) {
        // 如果已收藏，删除收藏
        await deleteFavorite(currentSourceRef.current, currentIdRef.current);
        setFavorited(false);
      } else {
        // 如果未收藏，添加收藏
        await saveFavorite(currentSourceRef.current, currentIdRef.current, {
          title: videoTitleRef.current,
          source_name: detailRef.current?.source_name || '',
          year: detailRef.current?.year,
          cover: detailRef.current?.poster || '',
          total_episodes: detailRef.current?.episodes.length || 1,
          save_time: Date.now(),
          search_title: searchTitle,
        });
        setFavorited(true);
      }
    } catch (err) {
      console.error('切换收藏失败:', err);
    }
  };

  useEffect(() => {
    if (
      !dynamicDeps?.Artplayer ||
      !dynamicDeps?.Hls ||
      !dynamicDeps?.artplayerPluginDanmuku ||
      !videoUrl ||
      loading ||
      currentEpisodeIndex === null ||
      !artRef.current
    ) {
      return;
    }

    const { Artplayer, Hls, artplayerPluginDanmuku } = dynamicDeps;

    // 确保选集索引有效
    if (
      !detail ||
      !detail.episodes ||
      currentEpisodeIndex >= detail.episodes.length ||
      currentEpisodeIndex < 0
    ) {
      setError(`选集索引无效，当前共 ${totalEpisodes} 集`);
      return;
    }

    if (!videoUrl) {
      setError('视频地址无效');
      return;
    }
    console.log(videoUrl);

    // 检测是否为WebKit浏览器
    const isWebkit =
      typeof window !== 'undefined' &&
      typeof (window as any).webkitConvertPointFromNodeToPage === 'function';

    // 检测是否为移动端设备
    const isMobile = typeof window !== 'undefined' && (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
    );

    // 根据设备类型调整弹幕配置
    const getDanmuConfig = () => {
      if (isMobile) {
        return {
          fontSize: 20, // 移动端字体稍小
          margin: [5, '20%'], // 移动端边距更小
          minWidth: 150, // 移动端最小宽度更小
          maxWidth: 300, // 移动端最大宽度限制
          maxlength: 30, // 移动端字符长度限制
          placeholder: '发弹幕~', // 移动端简化提示文字
        };
      } else {
        return {
          fontSize: 25, // 桌面端正常字体
          margin: [10, '25%'], // 桌面端正常边距
          minWidth: 200, // 桌面端最小宽度
          maxWidth: 500, // 桌面端最大宽度
          maxlength: 50, // 桌面端字符长度
          placeholder: '发个弹幕呗~', // 桌面端完整提示文字
        };
      }
    };

    const danmuConfig = getDanmuConfig();

    // 非WebKit浏览器且播放器已存在，使用switch方法切换
    if (!isWebkit && artPlayerRef.current) {
      artPlayerRef.current.switch = videoUrl;
      artPlayerRef.current.title = `${videoTitle} - 第${currentEpisodeIndex + 1
        }集`;
      artPlayerRef.current.poster = videoCover;
      if (artPlayerRef.current?.video) {
        ensureVideoSource(
          artPlayerRef.current.video as HTMLVideoElement,
          videoUrl
        );
      }
      return;
    }

    // WebKit浏览器或首次创建：销毁之前的播放器实例并创建新的
    if (artPlayerRef.current) {
      cleanupPlayer();
    }

    try {
      // 创建新的播放器实例
      Artplayer.PLAYBACK_RATE = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
      Artplayer.USE_RAF = true;

      // 生成当前视频的唯一ID
      const currentVideoId = generateVideoId(
        currentSourceRef.current,
        currentIdRef.current,
        currentEpisodeIndex
      );

      artPlayerRef.current = new Artplayer({
        container: artRef.current,
        url: videoUrl,
        poster: videoCover,
        volume: 0.7,
        isLive: false,
        muted: false,
        autoplay: true,
        pip: true,
        autoSize: false,
        autoMini: false,
        screenshot: false,
        setting: true,
        loop: false,
        flip: false,
        playbackRate: true,
        aspectRatio: false,
        fullscreen: true,
        fullscreenWeb: true,
        subtitleOffset: false,
        miniProgressBar: false,
        mutex: true,
        playsInline: true,
        autoPlayback: false,
        airplay: true,
        theme: '#3b82f6',
        lang: 'zh-cn',
        hotkey: false,
        fastForward: true,
        autoOrientation: true,
        lock: true,
        moreVideoAttr: {
          crossOrigin: 'anonymous',
        },
        // HLS 支持配置
        customType: {
          m3u8: function (video: HTMLVideoElement, url: string) {
            if (!Hls) {
              console.error('HLS.js 未加载');
              return;
            }

            if (video.hls) {
              video.hls.destroy();
            }

            const CustomHlsJsLoader = createCustomHlsJsLoader(Hls);

            // 针对短剧的特殊配置
            const isShortDrama = currentSourceRef.current === 'shortdrama';
            const hlsConfig = {
              debug: false, // 关闭日志
              enableWorker: true, // WebWorker 解码，降低主线程压力
              lowLatencyMode: !isShortDrama, // 短剧关闭低延迟模式，提高兼容性

              /* 缓冲/内存相关 - 短剧使用更保守的设置 */
              maxBufferLength: isShortDrama ? 20 : 30, // 短剧使用较小缓冲
              backBufferLength: isShortDrama ? 15 : 30, // 短剧保留更少已播放内容
              maxBufferSize: isShortDrama ? 40 * 1000 * 1000 : 60 * 1000 * 1000, // 短剧使用更小缓冲区

              /* 网络相关 - 短剧更宽松的超时设置 */
              manifestLoadingTimeOut: isShortDrama ? 20000 : 10000,
              manifestLoadingMaxRetry: isShortDrama ? 4 : 1,
              levelLoadingTimeOut: isShortDrama ? 20000 : 10000,
              levelLoadingMaxRetry: isShortDrama ? 4 : 3,
              fragLoadingTimeOut: isShortDrama ? 30000 : 20000,
              fragLoadingMaxRetry: isShortDrama ? 6 : 3,

              /* 自定义loader */
              loader: blockAdEnabledRef.current
                ? CustomHlsJsLoader
                : Hls.DefaultConfig.loader,
            };

            console.log('HLS配置:', {
              isShortDrama,
              url: url.includes('/api/proxy/video') ? '使用代理' : '直接访问',
              config: hlsConfig
            });

            const hls = new Hls(hlsConfig);

            hls.loadSource(url);
            hls.attachMedia(video);
            video.hls = hls;

            ensureVideoSource(video, url);

            hls.on(Hls.Events.ERROR, function (event: any, data: any) {
              const errorInfo = {
                type: data.type,
                details: data.details,
                fatal: data.fatal,
                isShortDrama,
                url: url.includes('/api/proxy/video') ? '代理地址' : '原始地址'
              };
              console.error('HLS播放错误:', errorInfo);

              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.log('网络错误，尝试恢复...', data.details);
                    if (isShortDrama && data.details === 'manifestLoadError') {
                      // 短剧清单加载失败，尝试重新加载
                      setTimeout(() => {
                        if (hls && !hls.destroyed) {
                          hls.startLoad();
                        }
                      }, 1000);
                    } else {
                      hls.startLoad();
                    }
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log('媒体错误，尝试恢复...', data.details);
                    hls.recoverMediaError();
                    break;
                  default:
                    console.log('无法恢复的错误:', data.type, data.details);
                    if (isShortDrama) {
                      // 短剧播放失败时给出更明确的提示
                      artPlayerRef.current?.notice?.show?.(`短剧播放出错: ${data.details || '未知错误'}`);
                    }
                    hls.destroy();
                    break;
                }
              } else {
                // 非致命错误，记录但继续播放
                console.warn('HLS非致命错误:', errorInfo);
              }
            });
          },
        },
        icons: {
          loading:
            '<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj48cGF0aCBkPSJNMjUuMjUxIDYuNDYxYy0xMC4zMTggMC0xOC42ODMgOC4zNjUtMTguNjgzIDE4LjY4M2g0LjA2OGMwLTguMDcgNi41NDUtMTQuNjE1IDE0LjYxNS0xNC42MTVWNi40NjF6IiBmaWxsPSIjMDA5Njg4Ij48YW5pbWF0ZVRyYW5zZm9ybSBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iIGF0dHJpYnV0ZVR5cGU9IlhNTCIgZHVyPSIxcyIgZnJvbT0iMCAyNSAyNSIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIHRvPSIzNjAgMjUgMjUiIHR5cGU9InJvdGF0ZSIvPjwvcGF0aD48L3N2Zz4=">',
        },
        plugins: danmuEnabled ? [
          artplayerPluginDanmuku({
            danmuku: async () => {
              try {
                const danmuData = await loadDanmuData(currentVideoId);
                return danmuData;
              } catch (error) {
                console.error('加载弹幕失败:', error);
                return [];
              }
            },
            speed: isMobile ? 4 : 5, // 移动端弹幕速度稍慢
            opacity: 1,
            fontSize: danmuConfig.fontSize,
            color: '#FFFFFF',
            mode: 0,
            margin: danmuConfig.margin,
            antiOverlap: true,
            useWorker: true,
            synchronousPlayback: false,
            filter: (danmu: any) => danmu.text.length < (isMobile ? 30 : 50),
            lockTime: isMobile ? 3 : 5, // 移动端锁定时间更短
            maxLength: isMobile ? 80 : 100, // 移动端最大长度限制
            minWidth: danmuConfig.minWidth,
            maxWidth: danmuConfig.maxWidth,
            theme: 'dark',
            // 核心配置：启用弹幕发送功能  
            panel: true, // 启用弹幕输入面板
            emit: true, // 启用弹幕发送
            placeholder: danmuConfig.placeholder,
            maxlength: danmuConfig.maxlength,
            // 移动端专用配置
            ...(isMobile && {
              panelStyle: {
                fontSize: '14px',
                padding: '8px 12px',
                borderRadius: '20px',
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                outline: 'none',
                width: '100%',
                maxWidth: '280px',
                boxSizing: 'border-box',
              },
              buttonStyle: {
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '16px',
                background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                marginLeft: '8px',
                minWidth: '50px',
                outline: 'none',
              },
            }),
            beforeVisible: (danmu: any) => {
              return !danmu.text.includes('广告');
            },
            beforeEmit: async (danmu: any) => {
              try {
                const result = await sendDanmu(currentVideoId, {
                  text: danmu.text,
                  color: danmu.color || '#FFFFFF',
                  mode: danmu.mode || 0,
                  time: artPlayerRef.current?.currentTime || 0
                });

                // 显示成功提示
                if (artPlayerRef.current?.notice) {
                  artPlayerRef.current.notice.show = '✅ 弹幕发送成功！';
                }

                // 创建符合插件要求的弹幕对象
                const danmuObject = {
                  text: danmu.text,
                  color: danmu.color || '#FFFFFF',
                  mode: danmu.mode || 0,
                  time: (artPlayerRef.current?.currentTime || 0) + 0.5,
                  border: false,
                  size: isMobile ? 18 : 25 // 移动端弹幕字体更小
                };

                // 手动触发弹幕显示（如果beforeEmit的返回值不能正常显示）
                // 这是一个备用方案
                setTimeout(() => {
                  try {
                    const danmakuPlugin = artPlayerRef.current?.plugins?.artplayerPluginDanmuku;
                    if (danmakuPlugin) {
                      // 确保弹幕未被隐藏
                      try {
                        if (danmakuPlugin.isHide && danmakuPlugin.show) {
                          danmakuPlugin.show();
                        }
                      } catch { }

                      // 尝试不同的方法来添加弹幕
                      if (danmakuPlugin.emit) {
                        danmakuPlugin.emit(danmuObject);
                      } else if (danmakuPlugin.add) {
                        danmakuPlugin.add(danmuObject);
                      } else if (danmakuPlugin.send) {
                        danmakuPlugin.send(danmuObject);
                      }
                    }
                  } catch (err) {
                    console.error('❌ 手动添加弹幕失败:', err);
                  }
                }, 200);

                // 返回弹幕对象让插件自动处理
                return danmuObject;
              } catch (error) {
                console.error('发送弹幕失败:', error);

                // 显示错误提示
                if (artPlayerRef.current?.notice) {
                  artPlayerRef.current.notice.show = '❌ 发送弹幕失败：' + (error as any).message;
                }

                // 阻止弹幕显示
                throw error;
              }
            }
          })
        ] : [],
        settings: [
          {
            html: '去广告',
            icon: '<text x="50%" y="50%" font-size="20" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#ffffff">AD</text>',
            tooltip: blockAdEnabled ? '已开启' : '已关闭',
            onClick() {
              const newVal = !blockAdEnabled;
              try {
                localStorage.setItem('enable_blockad', String(newVal));
                if (artPlayerRef.current) {
                  resumeTimeRef.current = artPlayerRef.current.currentTime;
                  if (
                    artPlayerRef.current.video &&
                    artPlayerRef.current.video.hls
                  ) {
                    artPlayerRef.current.video.hls.destroy();
                  }
                  artPlayerRef.current.destroy();
                  artPlayerRef.current = null;
                }
                setBlockAdEnabled(newVal);
              } catch (_) {
                // ignore
              }
              return newVal ? '当前开启' : '当前关闭';
            },
          },
          {
            html: '弹幕设置',
            icon: '<text x="50%" y="50%" font-size="18" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#ffffff">弹</text>',
            tooltip: danmuEnabled ? '弹幕已开启' : '弹幕已关闭',
            onClick() {
              const newVal = !danmuEnabled;
              try {
                localStorage.setItem('enableDanmu', String(newVal));
                if (artPlayerRef.current) {
                  resumeTimeRef.current = artPlayerRef.current.currentTime;
                  if (
                    artPlayerRef.current.video &&
                    artPlayerRef.current.video.hls
                  ) {
                    artPlayerRef.current.video.hls.destroy();
                  }
                  artPlayerRef.current.destroy();
                  artPlayerRef.current = null;
                }
                setDanmuEnabled(newVal);
              } catch (_) {
                // ignore
              }
              return newVal ? '弹幕已开启' : '弹幕已关闭';
            },
          },

          {
            name: '跳过片头片尾',
            html: '跳过片头片尾',
            switch: skipConfigRef.current.enable,
            onSwitch: function (item: any) {
              const newConfig = {
                ...skipConfigRef.current,
                enable: !item.switch,
              };
              handleSkipConfigChange(newConfig);
              return !item.switch;
            },
          },
          {
            html: '删除跳过配置',
            onClick: function () {
              handleSkipConfigChange({
                enable: false,
                intro_time: 0,
                outro_time: 0,
              });
              return '';
            },
          },
          {
            name: '设置片头',
            html: '设置片头',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="12" r="2" fill="#ffffff"/><path d="M9 12L17 12" stroke="#ffffff" stroke-width="2"/><path d="M17 6L17 18" stroke="#ffffff" stroke-width="2"/></svg>',
            tooltip:
              skipConfigRef.current.intro_time === 0
                ? '设置片头时间'
                : `${formatTime(skipConfigRef.current.intro_time)}`,
            onClick: function () {
              const currentTime = artPlayerRef.current?.currentTime || 0;
              if (currentTime > 0) {
                const newConfig = {
                  ...skipConfigRef.current,
                  intro_time: currentTime,
                };
                handleSkipConfigChange(newConfig);
                return `${formatTime(currentTime)}`;
              }
            },
          },
          {
            name: '设置片尾',
            html: '设置片尾',
            icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 6L7 18" stroke="#ffffff" stroke-width="2"/><path d="M7 12L15 12" stroke="#ffffff" stroke-width="2"/><circle cx="19" cy="12" r="2" fill="#ffffff"/></svg>',
            tooltip:
              skipConfigRef.current.outro_time >= 0
                ? '设置片尾时间'
                : `-${formatTime(-skipConfigRef.current.outro_time)}`,
            onClick: function () {
              const outroTime =
                -(
                  artPlayerRef.current?.duration -
                  artPlayerRef.current?.currentTime
                ) || 0;
              if (outroTime < 0) {
                const newConfig = {
                  ...skipConfigRef.current,
                  outro_time: outroTime,
                };
                handleSkipConfigChange(newConfig);
                return `-${formatTime(-outroTime)}`;
              }
            },
          },
        ],
        // 控制栏配置
        controls: [
          {
            position: 'left',
            index: 13,
            html: '<i class="art-icon flex"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="currentColor"/></svg></i>',
            tooltip: '播放下一集',
            click: function () {
              handleNextEpisode();
            },
          },
        ],
      });

      // 监听播放器事件
      artPlayerRef.current.on('ready', () => {
        setError(null);

        // 短剧播放状态日志
        const isShortDrama = currentSourceRef.current === 'shortdrama';
        if (isShortDrama) {
          console.log('短剧播放器就绪:', {
            title: videoTitle,
            episode: currentEpisodeIndex + 1,
            url: videoUrl.includes('/api/proxy/video') ? '使用代理' : '直接播放',
            videoElement: artPlayerRef.current?.video ? '视频元素正常' : '视频元素异常'
          });
        }

        // 检查弹幕插件是否正确加载
        if (danmuEnabled) {
          // 弹幕启用，无需调试日志
        }

        // 播放器就绪后，如果正在播放则请求 Wake Lock
        if (artPlayerRef.current && !artPlayerRef.current.paused) {
          requestWakeLock();
        }
      });

      // 监听播放状态变化，控制 Wake Lock
      artPlayerRef.current.on('play', () => {
        requestWakeLock();
      });

      artPlayerRef.current.on('pause', () => {
        releaseWakeLock();
        saveCurrentPlayProgress();
      });

      artPlayerRef.current.on('video:ended', () => {
        releaseWakeLock();
      });

      // 如果播放器初始化时已经在播放状态，则请求 Wake Lock
      if (artPlayerRef.current && !artPlayerRef.current.paused) {
        requestWakeLock();
      }

      artPlayerRef.current.on('video:volumechange', () => {
        lastVolumeRef.current = artPlayerRef.current.volume;
      });
      artPlayerRef.current.on('video:ratechange', () => {
        lastPlaybackRateRef.current = artPlayerRef.current.playbackRate;
      });

      // 监听视频可播放事件，这时恢复播放进度更可靠
      artPlayerRef.current.on('video:canplay', () => {
        // 若存在需要恢复的播放进度，则跳转
        if (resumeTimeRef.current && resumeTimeRef.current > 0) {
          try {
            const duration = artPlayerRef.current.duration || 0;
            let target = resumeTimeRef.current;
            if (duration && target >= duration - 2) {
              target = Math.max(0, duration - 5);
            }
            artPlayerRef.current.currentTime = target;
            console.log('成功恢复播放进度到:', resumeTimeRef.current);
          } catch (err) {
            console.warn('恢复播放进度失败:', err);
          }
        }
        resumeTimeRef.current = null;

        setTimeout(() => {
          if (
            Math.abs(artPlayerRef.current.volume - lastVolumeRef.current) > 0.01
          ) {
            artPlayerRef.current.volume = lastVolumeRef.current;
          }
          if (
            Math.abs(
              artPlayerRef.current.playbackRate - lastPlaybackRateRef.current
            ) > 0.01 &&
            isWebkit
          ) {
            artPlayerRef.current.playbackRate = lastPlaybackRateRef.current;
          }
          artPlayerRef.current.notice.show = '';
        }, 0);

        // 隐藏换源加载状态
        setIsVideoLoading(false);
      });

      // 监听视频时间更新事件，实现跳过片头片尾
      artPlayerRef.current.on('video:timeupdate', () => {
        if (!skipConfigRef.current.enable) return;

        const currentTime = artPlayerRef.current.currentTime || 0;
        const duration = artPlayerRef.current.duration || 0;
        const now = Date.now();

        // 限制跳过检查频率为1.5秒一次
        if (now - lastSkipCheckRef.current < 1500) return;
        lastSkipCheckRef.current = now;

        // 跳过片头
        if (
          skipConfigRef.current.intro_time > 0 &&
          currentTime < skipConfigRef.current.intro_time
        ) {
          artPlayerRef.current.currentTime = skipConfigRef.current.intro_time;
          artPlayerRef.current.notice.show = `已跳过片头 (${formatTime(
            skipConfigRef.current.intro_time
          )})`;
        }

        // 跳过片尾
        if (
          skipConfigRef.current.outro_time < 0 &&
          duration > 0 &&
          currentTime >
          artPlayerRef.current.duration + skipConfigRef.current.outro_time
        ) {
          if (
            currentEpisodeIndexRef.current <
            (detailRef.current?.episodes?.length || 1) - 1
          ) {
            handleNextEpisode();
          } else {
            artPlayerRef.current.pause();
          }
          artPlayerRef.current.notice.show = `已跳过片尾 (${formatTime(
            skipConfigRef.current.outro_time
          )})`;
        }
      });

      artPlayerRef.current.on('error', (err: any) => {
        const isShortDrama = currentSourceRef.current === 'shortdrama';
        const errorInfo = {
          error: err,
          isShortDrama,
          currentTime: artPlayerRef.current?.currentTime || 0,
          videoUrl: videoUrl.includes('/api/proxy/video') ? '代理地址' : '原始地址',
          episode: currentEpisodeIndex + 1
        };

        console.error('播放器错误:', errorInfo);

        if (isShortDrama) {
          // 短剧播放错误的特殊处理
          console.error('短剧播放错误详情:', {
            source: currentSourceRef.current,
            id: currentIdRef.current,
            episode: currentEpisodeIndex + 1,
            url: videoUrl,
            hasPlayedTime: (artPlayerRef.current?.currentTime || 0) > 0
          });
        }

        if (artPlayerRef.current.currentTime > 0) {
          return;
        }
      });

      // 监听视频播放结束事件，自动播放下一集
      artPlayerRef.current.on('video:ended', () => {
        const d = detailRef.current;
        const idx = currentEpisodeIndexRef.current;
        if (d && d.episodes && idx < d.episodes.length - 1) {
          setTimeout(() => {
            setCurrentEpisodeIndex(idx + 1);
          }, 1000);
        }
      });

      artPlayerRef.current.on('video:timeupdate', () => {
        const now = Date.now();
        let interval = 5000;
        if (process.env.NEXT_PUBLIC_STORAGE_TYPE === 'upstash') {
          interval = 20000;
        }
        if (now - lastSaveTimeRef.current > interval) {
          saveCurrentPlayProgress();
          lastSaveTimeRef.current = now;
        }
      });

      artPlayerRef.current.on('pause', () => {
        saveCurrentPlayProgress();
      });

      if (artPlayerRef.current?.video) {
        ensureVideoSource(
          artPlayerRef.current.video as HTMLVideoElement,
          videoUrl
        );
      }
    } catch (err) {
      console.error('创建播放器失败:', err);
      setError('播放器初始化失败');
    }
  }, [dynamicDeps, videoUrl, loading, blockAdEnabled, danmuEnabled, currentEpisodeIndex, currentSource, currentId]);

  // 当组件卸载时清理定时器、Wake Lock 和播放器资源
  useEffect(() => {
    return () => {
      // 清理定时器
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }

      // 释放 Wake Lock
      releaseWakeLock();

      // 销毁播放器实例
      cleanupPlayer();
    };
  }, []);

  if (loading) {
    const progressValue =
      loadingStage === 'searching' || loadingStage === 'fetching'
        ? 33
        : loadingStage === 'preferring'
          ? 66
          : 100;

    return (
      <PageLayout activePath='/play'>
        <div className='flex items-center justify-center min-h-screen bg-transparent'>
          <Card className='w-full max-w-md text-center'>
            <Card.Header className='items-center'>
              <Spinner />
              <Card.Title>{loadingMessage}</Card.Title>
              <Card.Description>正在准备播放器</Card.Description>
            </Card.Header>
            <Card.Content>
              <ProgressBar aria-label='加载进度' value={progressValue} color='accent'>
                <ProgressBar.Track>
                  <ProgressBar.Fill />
                </ProgressBar.Track>
              </ProgressBar>
            </Card.Content>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout activePath='/play'>
        <div className='flex items-center justify-center min-h-screen bg-transparent'>
          <Card className='w-full max-w-md'>
            <Card.Header>
              <Card.Title>哎呀，出现了一些问题</Card.Title>
              <Card.Description>请检查网络连接或尝试刷新页面</Card.Description>
            </Card.Header>
            <Card.Content>
              <Alert status='danger'>
                <Alert.Content>
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Content>
              </Alert>
            </Card.Content>
            <Card.Footer className='gap-3'>
              <Button
                fullWidth
                onPress={() =>
                  videoTitle
                    ? router.push(`/search?q=${encodeURIComponent(videoTitle)}`)
                    : router.back()
                }
              >
                {videoTitle ? '🔍 返回搜索' : '← 返回上页'}
              </Button>

              <Button
                fullWidth
                variant='tertiary'
                onPress={() => window.location.reload()}
              >
                🔄 重新尝试
              </Button>
            </Card.Footer>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout activePath='/play'>
      <div className='flex flex-col gap-3 py-4 px-5 lg:px-[3rem] 2xl:px-20'>
        {/* 第一行：影片标题 */}
        <div className='py-1'>
          <h1 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
            {videoTitle || '影片标题'}
            {totalEpisodes > 1 && (
              <span className='text-gray-500 dark:text-gray-400'>
                {` > ${detail?.episodes_titles?.[currentEpisodeIndex] || `第 ${currentEpisodeIndex + 1} 集`}`}
              </span>
            )}
          </h1>
        </div>
        {/* 第二行：播放器和选集 */}
        <div className='space-y-2'>
          {/* 折叠控制 - 仅在 lg 及以上屏幕显示 */}
          <div className='hidden lg:flex justify-end'>
            <Button
              variant='secondary'
              size='sm'
              aria-label={isEpisodeSelectorCollapsed ? '显示选集面板' : '隐藏选集面板'}
              onPress={() =>
                setIsEpisodeSelectorCollapsed(!isEpisodeSelectorCollapsed)
              }
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${isEpisodeSelectorCollapsed ? 'rotate-180' : 'rotate-0'
                  }`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M9 5l7 7-7 7'
                />
              </svg>
              {isEpisodeSelectorCollapsed ? '显示' : '隐藏'}
            </Button>
          </div>

          <div
            className={`grid gap-4 lg:h-[500px] xl:h-[650px] 2xl:h-[750px] transition-all duration-300 ease-in-out ${isEpisodeSelectorCollapsed
              ? 'grid-cols-1'
              : 'grid-cols-1 md:grid-cols-4'
              }`}
          >
            {/* 播放器 */}
            <div
              className={`h-full transition-all duration-300 ease-in-out rounded-xl border border-white/0 dark:border-white/30 ${isEpisodeSelectorCollapsed ? 'col-span-1' : 'md:col-span-3'
                }`}
            >
              <div className='relative w-full h-[300px] lg:h-full'>
                <div
                  ref={artRef}
                  className='bg-black w-full h-full rounded-xl overflow-hidden shadow-lg'
                ></div>

                {/* 换源加载蒙层 */}
                {isVideoLoading && (
                  <div className='absolute inset-0 z-[500] flex items-center justify-center bg-black/85'>
                    <Card variant='default' className='max-w-md p-6 text-center'>
                      <Spinner />
                      <p className='mt-4 text-lg font-semibold'>
                        {videoLoadingStage === 'sourceChanging'
                          ? '切换播放源...'
                          : '视频加载中...'}
                      </p>
                    </Card>
                  </div>
                )}
              </div>
            </div>

            {/* 选集和换源 - 在移动端始终显示，在 lg 及以上可折叠 */}
            <div
              className={`h-[300px] lg:h-full md:overflow-hidden transition-all duration-300 ease-in-out ${isEpisodeSelectorCollapsed
                ? 'md:col-span-1 lg:hidden lg:opacity-0 lg:scale-95'
                : 'md:col-span-1 lg:opacity-100 lg:scale-100'
                }`}
            >
              <EpisodeSelector
                totalEpisodes={totalEpisodes}
                episodes_titles={detail?.episodes_titles || []}
                value={currentEpisodeIndex + 1}
                onChange={handleEpisodeChange}
                onSourceChange={handleSourceChange}
                currentSource={currentSource}
                currentId={currentId}
                videoTitle={searchTitle || videoTitle}
                availableSources={availableSources}
                sourceSearchLoading={sourceSearchLoading}
                sourceSearchError={sourceSearchError}
                precomputedVideoInfo={precomputedVideoInfo}
              />
            </div>
          </div>
        </div>

        {/* 详情展示 */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {/* 文字区 */}
          <div className='md:col-span-3'>
            <div className='p-6 flex flex-col min-h-0'>
              {/* 标题 */}
              <h1 className='text-3xl font-bold mb-2 tracking-wide flex items-center flex-shrink-0 text-center md:text-left w-full'>
                {videoTitle || '影片标题'}
                <Button
                  isIconOnly
                  variant='tertiary'
                  aria-label={favorited ? '取消收藏' : '收藏'}
                  onPress={() => {
                    handleToggleFavorite();
                  }}
                  className='ml-3 flex-shrink-0'
                >
                  <FavoriteIcon filled={favorited} />
                </Button>
              </h1>

              {/* 关键信息行 */}
              <div className='flex flex-wrap items-center gap-3 text-base mb-4 opacity-80 flex-shrink-0'>
                {detail?.class && (
                  <Chip color='accent' variant='secondary'>
                    {detail.class}
                  </Chip>
                )}
                {(detail?.year || videoYear) && (
                  <Chip variant='secondary'>{detail?.year || videoYear}</Chip>
                )}
                {detail?.source_name && (
                  <Chip variant='secondary'>
                    {detail.source_name}
                  </Chip>
                )}
                {detail?.type_name && <Chip variant='secondary'>{detail.type_name}</Chip>}
              </div>

              {/* 短剧专用标签展示 */}
              {shortdramaId && (vodClass || vodTag) && (
                <div className='mb-4 flex-shrink-0'>
                  <div className='flex flex-wrap items-center gap-2'>
                    {/* vod_class 标签 - 分类标签 */}
                    {vodClass && (
                      <div className='flex items-center gap-1'>
                        <span className='text-xs text-gray-500 dark:text-gray-400 font-medium'>
                          分类:
                        </span>
                        <Chip color='accent' variant='secondary' size='sm'>
                          📂 {vodClass}
                        </Chip>
                      </div>
                    )}

                    {/* vod_tag 标签 - 内容标签 */}
                    {vodTag && parseVodTags(vodTag).length > 0 && (
                      <div className='flex items-center gap-1 flex-wrap'>
                        <span className='text-xs text-gray-500 dark:text-gray-400 font-medium'>
                          标签:
                        </span>
                        {parseVodTags(vodTag).map((tag, index) => (
                          <Chip
                            key={index}
                            variant='secondary'
                            size='sm'
                          >
                            🏷️ {tag}
                          </Chip>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* 剧情简介 */}
              {detail?.desc && (
                <div
                  className='mt-0 text-base leading-relaxed opacity-90 overflow-y-auto pr-2 flex-1 min-h-0 scrollbar-hide'
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {detail.desc}
                </div>
              )}
            </div>
          </div>

          {/* 封面展示 */}
          <div className='hidden md:block md:col-span-1 md:order-first'>
            <div className='pl-0 py-4 pr-6'>
              <div className='relative bg-gray-300 dark:bg-gray-700 aspect-[2/3] flex items-center justify-center rounded-xl overflow-hidden'>
                {videoCover ? (
                  <>
                    <img
                      src={processImageUrl(videoCover)}
                      alt={videoTitle}
                      className='w-full h-full object-cover'
                    />

                    {/* 豆瓣链接按钮 */}
                    {videoDoubanId !== 0 && (
                      <a
                        href={`https://movie.douban.com/subject/${videoDoubanId.toString()}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='absolute top-3 left-3'
                      >
                        <Button isIconOnly size='sm' variant='primary' aria-label='打开豆瓣页面'>
                          <svg
                            width='16'
                            height='16'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          >
                            <path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'></path>
                            <path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'></path>
                          </svg>
                        </Button>
                      </a>
                    )}
                  </>
                ) : (
                  <span className='text-gray-600 dark:text-gray-400'>
                    封面图片
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// FavoriteIcon 组件
const FavoriteIcon = ({ filled }: { filled: boolean }) => {
  if (filled) {
    return (
      <svg
        className='h-7 w-7'
        viewBox='0 0 24 24'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
          fill='#ef4444' /* Tailwind red-500 */
          stroke='#ef4444'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    );
  }
  return (
    <Heart className='h-7 w-7 stroke-[1] text-gray-600 dark:text-gray-300' />
  );
};

export default function PlayPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlayPageClient />
    </Suspense>
  );
}
