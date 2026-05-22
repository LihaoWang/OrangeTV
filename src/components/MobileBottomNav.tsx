/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { Cat, Clover, Film, Home, Play, Radio, Star, Tv } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface MobileBottomNavProps {
  /**
   * 主动指定当前激活的路径。当未提供时，自动使用 usePathname() 获取的路径。
   */
  activePath?: string;
}

const MobileBottomNav = ({ activePath }: MobileBottomNavProps) => {
  const pathname = usePathname();

  // 当前激活路径：优先使用传入的 activePath，否则回退到浏览器地址
  const currentActive = activePath ?? pathname;

  const [navItems, setNavItems] = useState([
    { icon: Home, label: '首页', href: '/' },
    {
      icon: Film,
      label: '电影',
      href: '/douban?type=movie',
    },
    {
      icon: Tv,
      label: '剧集',
      href: '/douban?type=tv',
    },
    {
      icon: Play,
      label: '短剧',
      href: '/shortdrama',
    },
    {
      icon: Cat,
      label: '动漫',
      href: '/douban?type=anime',
    },
    {
      icon: Clover,
      label: '综艺',
      href: '/douban?type=show',
    },
    {
      icon: Radio,
      label: '直播',
      href: '/live',
    },
  ]);

  useEffect(() => {
    const runtimeConfig = (window as any).RUNTIME_CONFIG;
    if (runtimeConfig?.CUSTOM_CATEGORIES?.length > 0) {
      setNavItems((prevItems) => [
        ...prevItems,
        {
          icon: Star,
          label: '自定义',
          href: '/douban?type=custom',
        },
      ]);
    }
  }, []);

  const isActive = (href: string) => {
    const typeMatch = href.match(/type=([^&]+)/)?.[1];

    // 解码URL以进行正确的比较
    const decodedActive = decodeURIComponent(currentActive);
    const decodedItemHref = decodeURIComponent(href);

    // 精确匹配路径
    if (decodedActive === decodedItemHref) {
      return true;
    }

    // 短剧页面的特殊处理
    if (href === '/shortdrama' && decodedActive.startsWith('/shortdrama')) {
      return true;
    }

    // 豆瓣页面的类型匹配
    if (decodedActive.startsWith('/douban') && typeMatch &&
      decodedActive.includes(`type=${typeMatch}`)) {
      return true;
    }

    return false;
  };

  return (
    <nav
      className='fixed left-0 right-0 z-[600] overflow-hidden border-t border-border/70 bg-surface/90 shadow-[0_-12px_40px_-30px_rgb(15_23_42)] backdrop-blur-xl md:hidden'
      style={{
        /* 紧贴视口底部，同时在内部留出安全区高度 */
        bottom: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
        minHeight: 'calc(3.5rem + env(safe-area-inset-bottom))',
      }}
    >
      <ul className='flex items-center overflow-x-auto scrollbar-hide'>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <li
              key={item.href}
              className='flex-shrink-0'
              style={{ width: '20vw', minWidth: '20vw' }}
            >
              <Link
                href={item.href}
                className='theme-transition relative flex h-14 w-full flex-col items-center justify-center gap-1 text-xs font-medium tracking-normal'
              >
                {active && <span className='absolute left-3 right-3 top-1 h-1 rounded-full bg-accent' />}
                <item.icon
                  className={`h-5 w-5 ${active
                    ? 'text-accent'
                    : 'text-muted'
                    }`}
                />
                <span
                  className={
                    active
                      ? 'text-foreground'
                      : 'text-muted'
                  }
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
