/* eslint-disable react-hooks/exhaustive-deps */

import { Clock, Target, Tv } from 'lucide-react';
import { Button, Card, Chip, EmptyState, Spinner } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';

import { formatTimeToHHMM, parseCustomTimeFormat } from '@/lib/time';

interface EpgProgram {
  start: string;
  end: string;
  title: string;
}

interface EpgScrollableRowProps {
  programs: EpgProgram[];
  currentTime?: Date;
  isLoading?: boolean;
}

export default function EpgScrollableRow({
  programs,
  currentTime = new Date(),
  isLoading = false,
}: EpgScrollableRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number>(-1);

  // 处理滚轮事件，实现横向滚动
  const handleWheel = (e: WheelEvent) => {
    if (isHovered && containerRef.current) {
      e.preventDefault(); // 阻止默认的竖向滚动

      const container = containerRef.current;
      const scrollAmount = e.deltaY * 4; // 增加滚动速度

      // 根据滚轮方向进行横向滚动
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // 阻止页面竖向滚动
  const preventPageScroll = (e: WheelEvent) => {
    if (isHovered) {
      e.preventDefault();
    }
  };

  // 自动滚动到正在播放的节目
  const scrollToCurrentProgram = () => {
    if (containerRef.current) {
      const currentProgramIndex = programs.findIndex(program => isCurrentlyPlaying(program));
      if (currentProgramIndex !== -1) {
        const programElement = containerRef.current.children[currentProgramIndex] as HTMLElement;
        if (programElement) {
          const container = containerRef.current;
          const programLeft = programElement.offsetLeft;
          const containerWidth = container.clientWidth;
          const programWidth = programElement.offsetWidth;

          // 计算滚动位置，使正在播放的节目居中显示
          const scrollLeft = programLeft - (containerWidth / 2) + (programWidth / 2);

          container.scrollTo({
            left: Math.max(0, scrollLeft),
            behavior: 'smooth'
          });
        }
      }
    }
  };

  useEffect(() => {
    if (isHovered) {
      // 鼠标悬停时阻止页面滚动
      document.addEventListener('wheel', preventPageScroll, { passive: false });
      document.addEventListener('wheel', handleWheel, { passive: false });
    } else {
      // 鼠标离开时恢复页面滚动
      document.removeEventListener('wheel', preventPageScroll);
      document.removeEventListener('wheel', handleWheel);
    }

    return () => {
      document.removeEventListener('wheel', preventPageScroll);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [isHovered]);

  // 组件加载后自动滚动到正在播放的节目
  useEffect(() => {
    // 延迟执行，确保DOM完全渲染
    const timer = setTimeout(() => {
      // 初始化当前正在播放的节目索引
      const initialPlayingIndex = programs.findIndex(program => isCurrentlyPlaying(program));
      setCurrentPlayingIndex(initialPlayingIndex);
      scrollToCurrentProgram();
    }, 100);

    return () => clearTimeout(timer);
  }, [programs, currentTime]);

  // 定时刷新正在播放状态
  useEffect(() => {
    // 每分钟刷新一次正在播放状态
    const interval = setInterval(() => {
      // 更新当前正在播放的节目索引
      const newPlayingIndex = programs.findIndex(program => {
        try {
          const start = parseCustomTimeFormat(program.start);
          const end = parseCustomTimeFormat(program.end);
          return currentTime >= start && currentTime < end;
        } catch {
          return false;
        }
      });

      if (newPlayingIndex !== currentPlayingIndex) {
        setCurrentPlayingIndex(newPlayingIndex);
        // 如果正在播放的节目发生变化，自动滚动到新位置
        scrollToCurrentProgram();
      }
    }, 60000); // 60秒 = 1分钟

    return () => clearInterval(interval);
  }, [programs, currentTime, currentPlayingIndex]);

  // 格式化时间显示
  const formatTime = (timeString: string) => {
    return formatTimeToHHMM(timeString);
  };

  // 判断节目是否正在播放
  const isCurrentlyPlaying = (program: EpgProgram) => {
    try {
      const start = parseCustomTimeFormat(program.start);
      const end = parseCustomTimeFormat(program.end);
      return currentTime >= start && currentTime < end;
    } catch {
      return false;
    }
  };

  // 加载中状态
  if (isLoading) {
    return (
      <div className='pt-4'>
        <div className='mb-3 flex items-center justify-between'>
          <h4 className='flex items-center gap-2 text-xs font-medium text-muted sm:text-sm'>
            <Clock className='h-3 w-3 sm:h-4 sm:w-4' />
            今日节目单
          </h4>
        </div>
        <div className='flex min-h-[100px] items-center justify-center sm:min-h-[120px]'>
          <Spinner />
          <span className='ml-3 text-sm text-muted sm:text-base'>加载节目单...</span>
        </div>
      </div>
    );
  }

  // 无节目单状态
  if (!programs || programs.length === 0) {
    return (
      <div className='pt-4'>
        <div className='mb-3 flex items-center justify-between'>
          <h4 className='flex items-center gap-2 text-xs font-medium text-muted sm:text-sm'>
            <Clock className='h-3 w-3 sm:h-4 sm:w-4' />
            今日节目单
          </h4>
        </div>
        <EmptyState>
          <Tv className='mx-auto mb-2 h-5 w-5' />
          暂无节目单数据
          <p className='mt-1 text-sm text-muted'>当前频道没有可显示的 EPG 信息</p>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className='mt-2 pt-4'>
      <div className='mb-3 flex items-center justify-between'>
        <h4 className='flex items-center gap-2 text-xs font-medium text-muted sm:text-sm'>
          <Clock className='h-3 w-3 sm:h-4 sm:w-4' />
          今日节目单
        </h4>
        {currentPlayingIndex !== -1 && (
          <Button
            size='sm'
            variant='secondary'
            onPress={scrollToCurrentProgram}
            aria-label='滚动到当前播放位置'
          >
            <Target className='h-3 w-3' />
            <span className='hidden sm:inline'>当前播放</span>
            <span className='sm:hidden'>当前</span>
          </Button>
        )}
      </div>

      <div
        className='relative'
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          ref={containerRef}
          className='scrollbar-hide flex min-h-[100px] gap-3 overflow-x-auto px-2 py-2 pb-4 sm:min-h-[120px] sm:px-4'
        >
          {programs.map((program, index) => {
            // 使用 currentPlayingIndex 来判断播放状态，确保样式能正确更新
            const isPlaying = index === currentPlayingIndex;
            return (
              <Card
                key={index}
                className='flex min-h-[100px] w-36 flex-shrink-0 flex-col p-2 sm:min-h-[120px] sm:w-48 sm:p-3'
              >
                {/* 时间显示在顶部 */}
                <div className='mb-2 flex flex-shrink-0 items-center justify-between sm:mb-3'>
                  <Chip size='sm' variant={isPlaying ? 'primary' : 'secondary'}>
                    {formatTime(program.start)}
                  </Chip>
                  <span className='text-xs text-muted'>
                    {formatTime(program.end)}
                  </span>
                </div>

                {/* 标题在中间，占据剩余空间 */}
                <div
                  className='flex-1 text-xs font-medium text-foreground sm:text-sm'
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: '1.4',
                    maxHeight: '2.8em'
                  }}
                  title={program.title}
                >
                  {program.title}
                </div>

                {/* 正在播放状态在底部 */}
                {isPlaying && (
                  <Chip size='sm' variant='primary' className='mt-auto'>
                    正在播放
                  </Chip>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
