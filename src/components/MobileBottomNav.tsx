/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { Clover, Film, Home, Star, Tv } from 'lucide-react';
import { Button, Card, ScrollShadow } from '@heroui/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface MobileBottomNavProps {
  /**
   * 主动指定当前激活的路径。当未提供时，自动使用 usePathname() 获取的路径。
   */
  activePath?: string;
}

const MobileBottomNav = ({ activePath }: MobileBottomNavProps) => {
  const pathname = usePathname();
  const router = useRouter();

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
      icon: Clover,
      label: '综艺',
      href: '/douban?type=show',
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

    // 豆瓣页面的类型匹配
    if (decodedActive.startsWith('/douban') && typeMatch &&
      decodedActive.includes(`type=${typeMatch}`)) {
      return true;
    }

    return false;
  };

  return (
    <Card
      className='fixed left-0 right-0 z-[600] rounded-none p-0 md:hidden'
      style={{
        /* 紧贴视口底部，同时在内部留出安全区高度 */
        bottom: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
        minHeight: 'calc(3.5rem + env(safe-area-inset-bottom))',
      }}
    >
      <ScrollShadow orientation='horizontal' hideScrollBar>
        <ul className='flex items-center gap-1 px-2'>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li
                key={item.href}
                className='flex-shrink-0'
                style={{ width: '20vw', minWidth: '20vw' }}
              >
                <Button
                  variant={active ? 'primary' : 'ghost'}
                  fullWidth
                  className='h-14 flex-col gap-1'
                  onPress={() => router.push(item.href)}
                >
                  <item.icon className='h-5 w-5' />
                  <span className='text-xs'>{item.label}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      </ScrollShadow>
    </Card>
  );
};

export default MobileBottomNav;
