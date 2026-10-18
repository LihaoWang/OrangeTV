import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';

interface ScrollableRowProps {
  children: React.ReactNode;
  scrollDistance?: number;
}

export default function ScrollableRow({
  children,
  scrollDistance = 1000,
}: ScrollableRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = containerRef.current;

      // 计算是否需要左右滚动按钮
      const threshold = 1; // 容差值，避免浮点误差
      const canScrollRight =
        scrollWidth - (scrollLeft + clientWidth) > threshold;
      const canScrollLeft = scrollLeft > threshold;

      setShowRightScroll(canScrollRight);
      setShowLeftScroll(canScrollLeft);
    }
  };

  useEffect(() => {
    // 多次延迟检查，确保内容已完全渲染
    checkScroll();

    // 监听窗口大小变化
    window.addEventListener('resize', checkScroll);

    // 创建一个 ResizeObserver 来监听容器大小变化
    const resizeObserver = new ResizeObserver(() => {
      // 延迟执行检查
      checkScroll();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', checkScroll);
      resizeObserver.disconnect();
    };
  }, [children]); // 依赖 children，当子组件变化时重新检查

  // 添加一个额外的效果来监听子组件的变化
  useEffect(() => {
    if (containerRef.current) {
      // 监听 DOM 变化
      const observer = new MutationObserver(() => {
        setTimeout(checkScroll, 100);
      });

      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      });

      return () => observer.disconnect();
    }
  }, []);

  const handleScrollRightClick = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: scrollDistance,
        behavior: 'smooth',
      });
    }
  };

  const handleScrollLeftClick = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: -scrollDistance,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div
      className='relative'
      onMouseEnter={() => {
        setIsHovered(true);
        // 当鼠标进入时重新检查一次
        checkScroll();
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={containerRef}
        className='scrollbar-hide flex space-x-4 overflow-x-auto px-1 pt-2 pb-5 sm:space-x-5 sm:pb-3'
        onScroll={checkScroll}
      >
        {children}
      </div>
      {showLeftScroll && (
        <div
          className={`pointer-events-none absolute top-0 bottom-0 left-0 z-[600] hidden w-20 items-center justify-start pl-3 transition-opacity duration-200 sm:flex ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Button
            isIconOnly
            variant='secondary'
            className='pointer-events-auto h-10 w-10 min-w-10 rounded-full bg-surface/85 shadow-lg ring-1 ring-border/70 backdrop-blur-md hover:bg-surface'
            onPress={handleScrollLeftClick}
            aria-label='向左滚动'
          >
            <ChevronLeft className='h-5 w-5' />
          </Button>
        </div>
      )}

      {showRightScroll && (
        <div
          className={`pointer-events-none absolute top-0 right-0 bottom-0 z-[600] hidden w-20 items-center justify-end pr-3 transition-opacity duration-200 sm:flex ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Button
            isIconOnly
            variant='secondary'
            className='pointer-events-auto h-10 w-10 min-w-10 rounded-full bg-surface/85 shadow-lg ring-1 ring-border/70 backdrop-blur-md hover:bg-surface'
            onPress={handleScrollRightClick}
            aria-label='向右滚动'
          >
            <ChevronRight className='h-5 w-5' />
          </Button>
        </div>
      )}
    </div>
  );
}
