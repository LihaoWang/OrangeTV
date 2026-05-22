/* eslint-disable react-hooks/exhaustive-deps */

'use client';

import React, { useMemo } from 'react';

import { AppFilterTabs } from './ui/HeroPrimitives';

interface CustomCategory {
  name: string;
  type: 'movie' | 'tv';
  query: string;
}

interface DoubanCustomSelectorProps {
  customCategories: CustomCategory[];
  primarySelection?: string;
  secondarySelection?: string;
  onPrimaryChange: (value: string) => void;
  onSecondaryChange: (value: string) => void;
}

const renderSelector = (
  label: string,
  options: { label: string; value: string }[],
  activeValue: string | undefined,
  onChange: (value: string) => void
) => (
  <AppFilterTabs
    ariaLabel={label}
    selectedKey={activeValue}
    onSelectionChange={onChange}
    items={options.map((option) => ({
      key: option.value,
      label: option.label,
    }))}
  />
);

const DoubanCustomSelector: React.FC<DoubanCustomSelectorProps> = ({
  customCategories,
  primarySelection,
  secondarySelection,
  onPrimaryChange,
  onSecondaryChange,
}) => {
  const primaryOptions = useMemo(() => {
    const types = Array.from(new Set(customCategories.map((cat) => cat.type)));

    return types
      .sort((a, b) => {
        if (a === 'movie' && b !== 'movie') return -1;
        if (a !== 'movie' && b === 'movie') return 1;
        return 0;
      })
      .map((type) => ({
        label: type === 'movie' ? '电影' : '剧集',
        value: type,
      }));
  }, [customCategories]);

  const secondaryOptions = useMemo(() => {
    if (!primarySelection) return [];

    return customCategories
      .filter((cat) => cat.type === primarySelection)
      .map((cat) => ({
        label: cat.name || cat.query,
        value: cat.query,
      }));
  }, [customCategories, primarySelection]);

  if (!customCategories || customCategories.length === 0) {
    return null;
  }

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div className='space-y-3 sm:space-y-4'>
        <div className='app-filter-row'>
          <span className='app-filter-label'>类型</span>
          <div className='min-w-0'>
            {renderSelector(
              '自定义类型',
              primaryOptions,
              primarySelection || primaryOptions[0]?.value,
              onPrimaryChange
            )}
          </div>
        </div>

        {secondaryOptions.length > 0 && (
          <div className='app-filter-row'>
            <span className='app-filter-label'>片单</span>
            <div className='min-w-0'>
              {renderSelector(
                '自定义片单',
                secondaryOptions,
                secondarySelection || secondaryOptions[0]?.value,
                onSecondaryChange
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoubanCustomSelector;
