/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import {
  Cat,
  Clover,
  ExternalLink,
  Film,
  Home,
  Menu,
  PlayCircle,
  Radio,
  Search,
  Star,
  Tv,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';

import { useSite } from './SiteProvider';

interface SidebarContextType {
  isCollapsed: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
});

export const useSidebar = () => useContext(SidebarContext);

// Logo 组件，支持展开/收起功能
interface LogoProps {
  isCollapsed: boolean;
  onClick?: () => void;
}

const Logo = ({ isCollapsed, onClick }: LogoProps) => {
  const { siteName } = useSite();

  if (isCollapsed) {
    return (
      <button
        onClick={onClick}
        className='theme-transition flex h-12 w-12 cursor-pointer items-center justify-center hover:opacity-80'
        title='点击展开侧边栏'
      >
        <Image
          src='/logo.png'
          alt={siteName}
          width={32}
          height={32}
          className='rounded-lg'
        />
      </button>
    );
  }

  return (
    <Link
      href='/'
      className='theme-transition flex h-16 items-center justify-center select-none hover:opacity-80'
    >
      <div className='flex items-center gap'>
        <Image
          src='/logo.png'
          alt={siteName}
          width={40}
          height={40}
          className='rounded-lg'
        />
        <span className='text-xl font-semibold tracking-normal text-foreground'>
          {siteName}
        </span>
      </div>
    </Link>
  );
};

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
  activePath?: string;
}

// 在浏览器环境下通过全局变量缓存折叠状态，避免组件重新挂载时出现初始值闪烁
declare global {
  interface Window {
    __sidebarCollapsed?: boolean;
  }
}

const Sidebar = ({ onToggle, activePath = '/' }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // 若同一次 SPA 会话中已经读取过折叠状态，则直接复用，避免闪烁
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.__sidebarCollapsed === 'boolean'
    ) {
      return window.__sidebarCollapsed;
    }
    return false; // 默认展开
  });

  // 首次挂载时读取 localStorage，以便刷新后仍保持上次的折叠状态
  useLayoutEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      const val = JSON.parse(saved);
      setIsCollapsed(val);
      window.__sidebarCollapsed = val;
    }
  }, []);

  // 当折叠状态变化时，同步到 <html> data 属性，供首屏 CSS 使用
  useLayoutEffect(() => {
    if (typeof document !== 'undefined') {
      if (isCollapsed) {
        document.documentElement.dataset.sidebarCollapsed = 'true';
      } else {
        delete document.documentElement.dataset.sidebarCollapsed;
      }
    }
  }, [isCollapsed]);

  const [active, setActive] = useState(activePath);

  useEffect(() => {
    // 优先使用传入的 activePath
    if (activePath) {
      setActive(activePath);
    } else {
      // 否则使用当前路径
      const getCurrentFullPath = () => {
        const queryString = searchParams.toString();
        return queryString ? `${pathname}?${queryString}` : pathname;
      };
      const fullPath = getCurrentFullPath();
      setActive(fullPath);
    }
  }, [activePath, pathname, searchParams]);

  const handleToggle = useCallback(() => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    if (typeof window !== 'undefined') {
      window.__sidebarCollapsed = newState;
    }
    onToggle?.(newState);
  }, [isCollapsed, onToggle]);

  const handleSearchClick = useCallback(() => {
    router.push('/search');
  }, [router]);

  const contextValue = {
    isCollapsed,
  };

  const [menuItems, setMenuItems] = useState([
    {
      icon: Film,
      label: '电影',
      href: '/douban?type=movie',
    },
    {
      icon: PlayCircle,
      label: '短剧',
      href: '/shortdrama',
    },
    {
      icon: Tv,
      label: '剧集',
      href: '/douban?type=tv',
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
      setMenuItems((prevItems) => [
        ...prevItems,
        {
          icon: Star,
          label: '自定义',
          href: '/douban?type=custom',
        },
      ]);
    }
  }, []);

  const getNavClasses = (isActive: boolean) =>
    `group flex min-h-[42px] items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium tracking-normal transition-all duration-200 ${
      isActive
        ? 'border-accent/25 bg-accent/10 text-accent shadow-sm'
        : 'border-transparent text-muted hover:border-border hover:bg-surface-secondary hover:text-foreground'
    }`;

  return (
    <SidebarContext.Provider value={contextValue}>
      {/* 在移动端隐藏侧边栏 */}
      <div className='hidden md:flex'>
        <aside
          data-sidebar
          className={`fixed left-0 top-0 z-10 h-screen border-r border-border/70 bg-surface/90 shadow-sm backdrop-blur-xl transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'
            }`}
        >
          <div className='flex h-full flex-col'>
            {/* 顶部 Logo 区域 */}
            <div className='relative h-16 border-b border-border/70'>
              <div className='absolute inset-0 flex items-center justify-center transition-all duration-200'>
                {isCollapsed ? (
                  <Logo isCollapsed={true} onClick={handleToggle} />
                ) : (
                  <div className='flex w-[calc(100%-4rem)] justify-center'>
                    <Logo isCollapsed={false} />
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <button
                  onClick={handleToggle}
                  className='a2-icon-button absolute right-3 top-1/2 z-10 -translate-y-1/2'
                  title='收起侧边栏'
                >
                  <Menu className='h-4 w-4' />
                </button>
              )}
            </div>

            {/* 首页和搜索导航 */}
            <nav className='mt-6 space-y-1 px-3'>
              <Link
                href='/'
                onClick={() => setActive('/')}
                data-active={active === '/'}
                className={getNavClasses(active === '/')}
              >
                <div className='w-4 h-4 flex items-center justify-center'>
                  <Home className='h-4 w-4' />
                </div>
                {!isCollapsed && (
                  <span className='opacity-100 transition-opacity duration-200 whitespace-nowrap'>
                    首页
                  </span>
                )}
              </Link>
              <Link
                href='/search'
                onClick={(e) => {
                  e.preventDefault();
                  handleSearchClick();
                  setActive('/search');
                }}
                data-active={active === '/search'}
                className={getNavClasses(active === '/search')}
              >
                <div className='w-4 h-4 flex items-center justify-center'>
                  <Search className='h-4 w-4' />
                </div>
                {!isCollapsed && (
                  <span className='opacity-100 transition-opacity duration-200 whitespace-nowrap'>
                    搜索
                  </span>
                )}
              </Link>
            </nav>

            {/* 菜单项 */}
            <div className='flex-1 overflow-y-auto px-3 pt-6'>
              <div className='space-y-1 border-t border-border/70 pt-4'>
                {menuItems.map((item) => {
                  // 检查当前路径是否匹配这个菜单项
                  const typeMatch = item.href.match(/type=([^&]+)/)?.[1];

                  // 解码URL以进行正确的比较
                  const decodedActive = decodeURIComponent(active);
                  const decodedItemHref = decodeURIComponent(item.href);

                  const isActive =
                    decodedActive === decodedItemHref ||
                    (decodedActive.startsWith('/douban') &&
                      decodedActive.includes(`type=${typeMatch}`)) ||
                    (item.href === '/shortdrama' && decodedActive.startsWith('/shortdrama'));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setActive(item.href)}
                      data-active={isActive}
                      className={getNavClasses(isActive)}
                    >
                      <div className='w-4 h-4 flex items-center justify-center'>
                        <Icon className='h-4 w-4' />
                      </div>
                      {!isCollapsed && (
                        <span className='opacity-100 transition-opacity duration-200 whitespace-nowrap'>
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 致谢信息 */}
            <div className='px-3 pb-5'>
              <div className='border-t border-border/70 pt-4'>
                {!isCollapsed ? (
                  <div className='px-2 text-center text-xs leading-relaxed text-muted'>
                    <span>本项目基于 </span>
                    <button
                      onClick={() => window.open('https://github.com/MoonTechLab/LunaTV', '_blank')}
                      className='theme-transition font-medium text-accent hover:text-accent-strong'
                    >
                      MoonTV
                    </button>
                    <button
                      onClick={() => window.open('https://github.com/MoonTechLab/LunaTV', '_blank')}
                      className='theme-transition ml-1 text-accent hover:text-accent-strong'
                      title='访问 MoonTV 项目'
                    >
                      <ExternalLink className='h-3 w-3 inline' />
                    </button>
                    <span> 的二次开发</span>
                  </div>
                ) : (
                  <div className='flex justify-center'>
                    <button
                      onClick={() => window.open('https://github.com/MoonTechLab/LunaTV', '_blank')}
                      className='theme-transition p-1 text-accent hover:text-accent-strong'
                      title='基于 MoonTV 的二次开发'
                    >
                      <ExternalLink className='h-4 w-4' />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
        <div
          className={`transition-all duration-300 sidebar-offset ${isCollapsed ? 'w-16' : 'w-64'
            }`}
        ></div>
      </div>
    </SidebarContext.Provider>
  );
};

export default Sidebar;
