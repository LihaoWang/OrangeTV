'use client';

import { Card, Link as HeroLink } from '@heroui/react';

import { BackButton } from './BackButton';
import { useSite } from './SiteProvider';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

interface MobileHeaderProps {
  showBackButton?: boolean;
}

const MobileHeader = ({ showBackButton = false }: MobileHeaderProps) => {
  const { siteName } = useSite();
  return (
    <Card className='fixed left-0 right-0 top-0 z-[999] w-full rounded-none p-0 md:hidden'>
      <div className='flex h-12 items-center justify-between px-4'>
        {/* 左侧：搜索按钮、返回按钮和设置按钮 */}
        <div className='flex items-center gap-2'>
          <HeroLink
            href='/search'
            aria-label='搜索'
          >
            <svg
              className='h-5 w-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
          </HeroLink>
          {showBackButton && <BackButton />}
        </div>

        {/* 右侧按钮 */}
        <div className='flex items-center gap-1'>
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

        {/* 中间：Logo（绝对居中） */}
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
          <HeroLink
            href='/'
            className='text-lg font-semibold'
          >
            {siteName}
          </HeroLink>
      </div>
    </Card>
  );
};

export default MobileHeader;
