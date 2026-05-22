/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, no-console */

'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';

import {
  BangumiCalendarData,
  GetBangumiCalendarData,
} from '@/lib/bangumi.client';
// 客户端收藏 API
import {
  clearAllFavorites,
  getAllFavorites,
  getAllPlayRecords,
  subscribeToDataUpdates,
} from '@/lib/db.client';
import { getDoubanCategories } from '@/lib/douban.client';
import { DoubanItem } from '@/lib/types';

import CapsuleSwitch from '@/components/CapsuleSwitch';
import ContinueWatching from '@/components/ContinueWatching';
import PageLayout from '@/components/PageLayout';
import ScrollableRow from '@/components/ScrollableRow';
import { useSite } from '@/components/SiteProvider';
import VideoCard from '@/components/VideoCard';

function HomeClient() {
  const [activeTab, setActiveTab] = useState<'home' | 'favorites'>('home');
  const [hotMovies, setHotMovies] = useState<DoubanItem[]>([]);
  const [hotTvShows, setHotTvShows] = useState<DoubanItem[]>([]);
  const [hotVarietyShows, setHotVarietyShows] = useState<DoubanItem[]>([]);
  const [bangumiCalendarData, setBangumiCalendarData] = useState<
    BangumiCalendarData[]
  >([]);
  const [loading, setLoading] = useState(true);
  const { announcement } = useSite();

  const [showAnnouncement, setShowAnnouncement] = useState(false);

  // 检查公告弹窗状态
  useEffect(() => {
    if (typeof window !== 'undefined' && announcement) {
      const hasSeenAnnouncement = localStorage.getItem('hasSeenAnnouncement');
      if (hasSeenAnnouncement !== announcement) {
        setShowAnnouncement(true);
      } else {
        setShowAnnouncement(Boolean(!hasSeenAnnouncement && announcement));
      }
    }
  }, [announcement]);

  // 收藏夹数据
  type FavoriteItem = {
    id: string;
    source: string;
    title: string;
    poster: string;
    episodes: number;
    source_name: string;
    currentEpisode?: number;
    search_title?: string;
    origin?: 'vod' | 'live';
  };

  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    const fetchRecommendData = async () => {
      try {
        setLoading(true);

        // 并行获取热门电影、热门剧集和热门综艺
        const [moviesData, tvShowsData, varietyShowsData, bangumiCalendarData] =
          await Promise.all([
            getDoubanCategories({
              kind: 'movie',
              category: '热门',
              type: '全部',
            }),
            getDoubanCategories({ kind: 'tv', category: 'tv', type: 'tv' }),
            getDoubanCategories({ kind: 'tv', category: 'show', type: 'show' }),
            GetBangumiCalendarData(),
          ]);

        if (moviesData.code === 200) {
          setHotMovies(moviesData.list);
        }

        if (tvShowsData.code === 200) {
          setHotTvShows(tvShowsData.list);
        }

        if (varietyShowsData.code === 200) {
          setHotVarietyShows(varietyShowsData.list);
        }

        setBangumiCalendarData(bangumiCalendarData);
      } catch (error) {
        console.error('获取推荐数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendData();
  }, []);

  // 处理收藏数据更新的函数
  const updateFavoriteItems = async (allFavorites: Record<string, any>) => {
    const allPlayRecords = await getAllPlayRecords();

    // 根据保存时间排序（从近到远）
    const sorted = Object.entries(allFavorites)
      .sort(([, a], [, b]) => b.save_time - a.save_time)
      .map(([key, fav]) => {
        const plusIndex = key.indexOf('+');
        const source = key.slice(0, plusIndex);
        const id = key.slice(plusIndex + 1);

        // 查找对应的播放记录，获取当前集数
        const playRecord = allPlayRecords[key];
        const currentEpisode = playRecord?.index;

        return {
          id,
          source,
          title: fav.title,
          year: fav.year,
          poster: fav.cover,
          episodes: fav.total_episodes,
          source_name: fav.source_name,
          currentEpisode,
          search_title: fav?.search_title,
          origin: fav?.origin,
        } as FavoriteItem;
      });
    setFavoriteItems(sorted);
  };

  // 当切换到收藏夹时加载收藏数据
  useEffect(() => {
    if (activeTab !== 'favorites') return;

    const loadFavorites = async () => {
      const allFavorites = await getAllFavorites();
      await updateFavoriteItems(allFavorites);
    };

    loadFavorites();

    // 监听收藏更新事件
    const unsubscribe = subscribeToDataUpdates(
      'favoritesUpdated',
      (newFavorites: Record<string, any>) => {
        updateFavoriteItems(newFavorites);
      }
    );

    return unsubscribe;
  }, [activeTab]);

  const handleCloseAnnouncement = (announcement: string) => {
    setShowAnnouncement(false);
    localStorage.setItem('hasSeenAnnouncement', announcement); // 记录已查看弹窗
  };

  return (
    <PageLayout>
      <div className='overflow-visible px-4 py-6 sm:px-10 sm:py-10'>
        {/* 顶部 Tab 切换 */}
        <div className='mb-10 flex justify-center'>
          <CapsuleSwitch
            options={[
              { label: '首页', value: 'home' },
              { label: '收藏夹', value: 'favorites' },
            ]}
            active={activeTab}
            onChange={(value) => setActiveTab(value as 'home' | 'favorites')}
          />
        </div>

        <div className='mx-auto max-w-[1380px] space-y-10'>
          {activeTab === 'favorites' ? (
            // 收藏夹视图
            <section className='rounded-3xl border border-border/70 bg-surface/70 p-5 shadow-sm backdrop-blur sm:p-6'>
              <div className='mb-5 flex items-end justify-between gap-4'>
                <div className='space-y-1'>
                  <p className='a2-kicker'>Saved</p>
                  <h2 className='text-2xl font-semibold tracking-normal text-foreground'>
                    我的收藏
                  </h2>
                </div>
                {favoriteItems.length > 0 && (
                  <button
                    className='a2-link-action'
                    onClick={async () => {
                      await clearAllFavorites();
                      setFavoriteItems([]);
                    }}
                  >
                    清空
                  </button>
                )}
              </div>
              <div className='grid justify-start grid-cols-3 gap-x-3 gap-y-14 px-0 sm:grid-cols-[repeat(auto-fill,_minmax(11rem,_1fr))] sm:gap-x-8 sm:gap-y-20'>
                {favoriteItems.map((item) => (
                  <div key={item.id + item.source} className='w-full'>
                    <VideoCard
                      query={item.search_title}
                      {...item}
                      from='favorite'
                      type={item.episodes > 1 ? 'tv' : ''}
                    />
                  </div>
                ))}
                {favoriteItems.length === 0 && (
                  <div className='col-span-full rounded-2xl border border-dashed border-border bg-surface-secondary/60 py-10 text-center text-sm font-medium tracking-normal text-muted'>
                    暂无收藏内容
                  </div>
                )}
              </div>
            </section>
          ) : (
            // 首页视图
            <>
              {/* 继续观看 */}
              <ContinueWatching />

              {/* 热门电影 */}
              <section className='rounded-3xl border border-border/70 bg-surface/70 p-5 shadow-sm backdrop-blur sm:p-6'>
                <div className='mb-5 flex items-end justify-between gap-4'>
                  <div className='space-y-1'>
                    <p className='a2-kicker'>精选推荐</p>
                    <h2 className='text-2xl font-semibold tracking-normal text-foreground'>
                      热门电影
                    </h2>
                  </div>
                  <Link
                    href='/douban?type=movie'
                    className='a2-link-action'
                  >
                    查看更多
                  </Link>
                </div>
                <ScrollableRow>
                  {loading
                    ? // 加载状态显示灰色占位数据
                    Array.from({ length: 8 }).map((_, index) => (
                      <div
                        key={index}
                        className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                      >
                        <div className='relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-border bg-surface-secondary animate-pulse'>
                          <div className='absolute inset-0 bg-surface-tertiary'></div>
                        </div>
                        <div className='mt-3 h-4 rounded-lg bg-surface-secondary animate-pulse'></div>
                      </div>
                    ))
                    : // 显示真实数据
                    hotMovies.map((movie, index) => (
                      <div
                        key={index}
                        className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                      >
                        <VideoCard
                          from='douban'
                          title={movie.title}
                          poster={movie.poster}
                          douban_id={Number(movie.id)}
                          rate={movie.rate}
                          year={movie.year}
                          type='movie'
                        />
                      </div>
                    ))}
                </ScrollableRow>
              </section>

              {/* 热门剧集 */}
              <section className='rounded-3xl border border-border/70 bg-surface/70 p-5 shadow-sm backdrop-blur sm:p-6'>
                <div className='mb-5 flex items-end justify-between gap-4'>
                  <div className='space-y-1'>
                    <p className='a2-kicker'>Series</p>
                    <h2 className='text-2xl font-semibold tracking-normal text-foreground'>
                      热门剧集
                    </h2>
                  </div>
                  <Link href='/douban?type=tv' className='a2-link-action'>
                    查看更多
                  </Link>
                </div>
                <ScrollableRow>
                  {loading
                    ? // 加载状态显示灰色占位数据
                    Array.from({ length: 8 }).map((_, index) => (
                      <div
                        key={index}
                        className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                      >
                        <div className='relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-border bg-surface-secondary animate-pulse'>
                          <div className='absolute inset-0 bg-surface-tertiary'></div>
                        </div>
                        <div className='mt-3 h-4 rounded-lg bg-surface-secondary animate-pulse'></div>
                      </div>
                    ))
                    : // 显示真实数据
                    hotTvShows.map((show, index) => (
                      <div
                        key={index}
                        className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                      >
                        <VideoCard
                          from='douban'
                          title={show.title}
                          poster={show.poster}
                          douban_id={Number(show.id)}
                          rate={show.rate}
                          year={show.year}
                        />
                      </div>
                    ))}
                </ScrollableRow>
              </section>

              {/* 每日新番放送 */}
              <section className='rounded-3xl border border-border/70 bg-surface/70 p-5 shadow-sm backdrop-blur sm:p-6'>
                <div className='mb-5 flex items-end justify-between gap-4'>
                  <div className='space-y-1'>
                    <p className='a2-kicker'>Bangumi</p>
                    <h2 className='text-2xl font-semibold tracking-normal text-foreground'>
                      新番放送
                    </h2>
                  </div>
                  <Link
                    href='/douban?type=anime'
                    className='a2-link-action'
                  >
                    查看更多
                  </Link>
                </div>
                <ScrollableRow>
                  {loading
                    ? // 加载状态显示灰色占位数据
                    Array.from({ length: 8 }).map((_, index) => (
                      <div
                        key={index}
                        className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                      >
                        <div className='relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-border bg-surface-secondary animate-pulse'>
                          <div className='absolute inset-0 bg-surface-tertiary'></div>
                        </div>
                        <div className='mt-3 h-4 rounded-lg bg-surface-secondary animate-pulse'></div>
                      </div>
                    ))
                    : // 展示当前日期的番剧
                    (() => {
                      // 获取当前日期对应的星期
                      const today = new Date();
                      const weekdays = [
                        'Sun',
                        'Mon',
                        'Tue',
                        'Wed',
                        'Thu',
                        'Fri',
                        'Sat',
                      ];
                      const currentWeekday = weekdays[today.getDay()];

                      // 找到当前星期对应的番剧数据
                      const todayAnimes =
                        bangumiCalendarData.find(
                          (item) => item.weekday.en === currentWeekday
                        )?.items || [];

                      return todayAnimes.map((anime, index) => (
                        <div
                          key={`${anime.id || 0}-${index}`}
                          className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                        >
                          <VideoCard
                            from='douban'
                            title={anime.name_cn || anime.name || '未知标题'}
                            poster={
                              anime.images?.large ||
                              anime.images?.common ||
                              anime.images?.medium ||
                              anime.images?.small ||
                              anime.images?.grid ||
                              '' // 空字符串，让 VideoCard 组件处理图片加载失败
                            }
                            douban_id={anime.id || 0}
                            rate={anime.rating?.score?.toFixed(1) || ''}
                            year={anime.air_date?.split('-')?.[0] || ''}
                            isBangumi={true}
                          />
                        </div>
                      ));
                    })()}
                </ScrollableRow>
              </section>

              {/* 热门综艺 */}
              <section className='rounded-3xl border border-border/70 bg-surface/70 p-5 shadow-sm backdrop-blur sm:p-6'>
                <div className='mb-5 flex items-end justify-between gap-4'>
                  <div className='space-y-1'>
                    <p className='a2-kicker'>Shows</p>
                    <h2 className='text-2xl font-semibold tracking-normal text-foreground'>
                      热门综艺
                    </h2>
                  </div>
                  <Link
                    href='/douban?type=show'
                    className='a2-link-action'
                  >
                    查看更多
                  </Link>
                </div>
                <ScrollableRow>
                  {loading
                    ? // 加载状态显示灰色占位数据
                    Array.from({ length: 8 }).map((_, index) => (
                      <div
                        key={index}
                        className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                      >
                        <div className='relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-border bg-surface-secondary animate-pulse'>
                          <div className='absolute inset-0 bg-surface-tertiary'></div>
                        </div>
                        <div className='mt-3 h-4 rounded-lg bg-surface-secondary animate-pulse'></div>
                      </div>
                    ))
                    : // 显示真实数据
                    hotVarietyShows.map((show, index) => (
                      <div
                        key={index}
                        className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                      >
                        <VideoCard
                          from='douban'
                          title={show.title}
                          poster={show.poster}
                          douban_id={Number(show.id)}
                          rate={show.rate}
                          year={show.year}
                        />
                      </div>
                    ))}
                </ScrollableRow>
              </section>
            </>
          )}
        </div>
      </div>
      {announcement && showAnnouncement && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm dark:bg-black/70 p-4 transition-opacity duration-300 ${showAnnouncement ? '' : 'opacity-0 pointer-events-none'
            }`}
          onTouchStart={(e) => {
            // 如果点击的是背景区域，阻止触摸事件冒泡，防止背景滚动
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
          onTouchMove={(e) => {
            // 如果触摸的是背景区域，阻止触摸移动，防止背景滚动
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onTouchEnd={(e) => {
            // 如果触摸的是背景区域，阻止触摸结束事件，防止背景滚动
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
          style={{
            touchAction: 'none', // 禁用所有触摸操作
          }}
        >
          <div
            className='a2-panel w-full max-w-md p-6 transform transition-all duration-300'
            onTouchMove={(e) => {
              // 允许公告内容区域正常滚动，阻止事件冒泡到外层
              e.stopPropagation();
            }}
            style={{
              touchAction: 'auto', // 允许内容区域的正常触摸操作
            }}
          >
            <div className='flex justify-between items-start mb-4'>
              <h3 className='a2-title border-b border-border/70 pb-3 text-[1.75rem]'>
                提示
              </h3>
              <button
                onClick={() => handleCloseAnnouncement(announcement)}
                className='a2-icon-button h-8 w-8 p-1.5'
                aria-label='关闭'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
            <div className='mb-6'>
              <div className='border-l-4 border-accent pl-4'>
                <p className='a2-muted-copy'>
                  {announcement}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleCloseAnnouncement(announcement)}
              className='a2-link-action w-full justify-center border-b-0 border-t border-border/70 px-4 pt-3'
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeClient />
    </Suspense>
  );
}
