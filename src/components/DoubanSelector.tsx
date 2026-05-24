/* eslint-disable react-hooks/exhaustive-deps */

'use client';

import React from 'react';

import MultiLevelSelector from './MultiLevelSelector';
import { AppFilterSelect } from './ui/HeroPrimitives';
import WeekdaySelector from './WeekdaySelector';

interface SelectorOption {
  label: string;
  value: string;
}

interface DoubanSelectorProps {
  type: 'movie' | 'tv' | 'show' | 'anime';
  primarySelection?: string;
  secondarySelection?: string;
  onPrimaryChange: (value: string) => void;
  onSecondaryChange: (value: string) => void;
  onMultiLevelChange?: (values: Record<string, string>) => void;
  onWeekdayChange: (weekday: string) => void;
}

const moviePrimaryOptions: SelectorOption[] = [
  { label: '全部', value: '全部' },
  { label: '热门电影', value: '热门' },
  { label: '最新电影', value: '最新' },
  { label: '豆瓣高分', value: '豆瓣高分' },
  { label: '冷门佳片', value: '冷门佳片' },
];

const movieSecondaryOptions: SelectorOption[] = [
  { label: '全部', value: '全部' },
  { label: '华语', value: '华语' },
  { label: '欧美', value: '欧美' },
  { label: '韩国', value: '韩国' },
  { label: '日本', value: '日本' },
];

const tvPrimaryOptions: SelectorOption[] = [
  { label: '全部', value: '全部' },
  { label: '最近热门', value: '最近热门' },
];

const tvSecondaryOptions: SelectorOption[] = [
  { label: '全部', value: 'tv' },
  { label: '国产', value: 'tv_domestic' },
  { label: '欧美', value: 'tv_american' },
  { label: '日本', value: 'tv_japanese' },
  { label: '韩国', value: 'tv_korean' },
  { label: '动漫', value: 'tv_animation' },
  { label: '纪录片', value: 'tv_documentary' },
];

const showPrimaryOptions: SelectorOption[] = [
  { label: '全部', value: '全部' },
  { label: '最近热门', value: '最近热门' },
];

const showSecondaryOptions: SelectorOption[] = [
  { label: '全部', value: 'show' },
  { label: '国内', value: 'show_domestic' },
  { label: '国外', value: 'show_foreign' },
];

const animePrimaryOptions: SelectorOption[] = [
  { label: '每日放送', value: '每日放送' },
  { label: '番剧', value: '番剧' },
  { label: '剧场版', value: '剧场版' },
];

const renderSelector = (
  label: string,
  ariaLabel: string,
  options: SelectorOption[],
  activeValue: string | undefined,
  onChange: (value: string) => void
) => (
  <AppFilterSelect
    ariaLabel={ariaLabel}
    label={label}
    options={options}
    value={activeValue}
    onChange={onChange}
  />
);

const FilterGrid = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div className='grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5'>
    {children}
  </div>
);

const DoubanSelector: React.FC<DoubanSelectorProps> = ({
  type,
  primarySelection,
  secondarySelection,
  onPrimaryChange,
  onSecondaryChange,
  onMultiLevelChange,
  onWeekdayChange,
}) => {
  const handleMultiLevelChange = (values: Record<string, string>) => {
    onMultiLevelChange?.(values);
  };

  return (
    <div className='space-y-4 sm:space-y-6'>
      {type === 'movie' && (
        <FilterGrid>
          {renderSelector(
            '分类',
            '电影分类选项',
            moviePrimaryOptions,
            primarySelection || moviePrimaryOptions[0].value,
            onPrimaryChange
          )}

          {primarySelection !== '全部' ? (
            renderSelector(
              '地区',
              '电影地区选项',
              movieSecondaryOptions,
              secondarySelection || movieSecondaryOptions[0].value,
              onSecondaryChange
            )
          ) : (
            <div className='col-span-full'>
              <MultiLevelSelector
                key={`${type}-${primarySelection}`}
                onChange={handleMultiLevelChange}
                contentType={type}
              />
            </div>
          )}
        </FilterGrid>
      )}

      {type === 'tv' && (
        <FilterGrid>
          {renderSelector(
            '分类',
            '剧集分类选项',
            tvPrimaryOptions,
            primarySelection || tvPrimaryOptions[1].value,
            onPrimaryChange
          )}

          {(primarySelection || tvPrimaryOptions[1].value) === '最近热门' ? (
            renderSelector(
              '类型',
              '剧集类型选项',
              tvSecondaryOptions,
              secondarySelection || tvSecondaryOptions[0].value,
              onSecondaryChange
            )
          ) : (primarySelection || tvPrimaryOptions[1].value) === '全部' ? (
            <div className='col-span-full'>
              <MultiLevelSelector
                key={`${type}-${primarySelection}`}
                onChange={handleMultiLevelChange}
                contentType={type}
              />
            </div>
          ) : null}
        </FilterGrid>
      )}

      {type === 'anime' && (
        <FilterGrid>
          {renderSelector(
            '分类',
            '动漫分类选项',
            animePrimaryOptions,
            primarySelection || animePrimaryOptions[0].value,
            onPrimaryChange
          )}

          {(primarySelection || animePrimaryOptions[0].value) === '每日放送' ? (
            <div className='min-w-0'>
              <WeekdaySelector onWeekdayChange={onWeekdayChange} />
            </div>
          ) : (
            <div className='col-span-full'>
              {(primarySelection || animePrimaryOptions[0].value) === '番剧' ? (
                <MultiLevelSelector
                  key={`anime-tv-${primarySelection}`}
                  onChange={handleMultiLevelChange}
                  contentType='anime-tv'
                />
              ) : (
                <MultiLevelSelector
                  key={`anime-movie-${primarySelection}`}
                  onChange={handleMultiLevelChange}
                  contentType='anime-movie'
                />
              )}
            </div>
          )}
        </FilterGrid>
      )}

      {type === 'show' && (
        <FilterGrid>
          {renderSelector(
            '分类',
            '综艺分类选项',
            showPrimaryOptions,
            primarySelection || showPrimaryOptions[1].value,
            onPrimaryChange
          )}

          {(primarySelection || showPrimaryOptions[1].value) === '最近热门' ? (
            renderSelector(
              '类型',
              '综艺类型选项',
              showSecondaryOptions,
              secondarySelection || showSecondaryOptions[0].value,
              onSecondaryChange
            )
          ) : (primarySelection || showPrimaryOptions[1].value) === '全部' ? (
            <div className='col-span-full'>
              <MultiLevelSelector
                key={`${type}-${primarySelection}`}
                onChange={handleMultiLevelChange}
                contentType={type}
              />
            </div>
          ) : null}
        </FilterGrid>
      )}
    </div>
  );
};

export default DoubanSelector;
