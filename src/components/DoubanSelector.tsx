/* eslint-disable react-hooks/exhaustive-deps */

'use client';

import React from 'react';

import MultiLevelSelector from './MultiLevelSelector';
import { AppFilterTabs } from './ui/HeroPrimitives';
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
  options: SelectorOption[],
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

const FilterRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className='app-filter-row'>
    <span className='app-filter-label'>{label}</span>
    <div className='min-w-0'>{children}</div>
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
        <div className='space-y-3 sm:space-y-4'>
          <FilterRow label='分类'>
            {renderSelector(
              '电影分类',
              moviePrimaryOptions,
              primarySelection || moviePrimaryOptions[0].value,
              onPrimaryChange
            )}
          </FilterRow>

          {primarySelection !== '全部' ? (
            <FilterRow label='地区'>
              {renderSelector(
                '电影地区',
                movieSecondaryOptions,
                secondarySelection || movieSecondaryOptions[0].value,
                onSecondaryChange
              )}
            </FilterRow>
          ) : (
            <FilterRow label='筛选'>
              <MultiLevelSelector
                key={`${type}-${primarySelection}`}
                onChange={handleMultiLevelChange}
                contentType={type}
              />
            </FilterRow>
          )}
        </div>
      )}

      {type === 'tv' && (
        <div className='space-y-3 sm:space-y-4'>
          <FilterRow label='分类'>
            {renderSelector(
              '剧集分类',
              tvPrimaryOptions,
              primarySelection || tvPrimaryOptions[1].value,
              onPrimaryChange
            )}
          </FilterRow>

          {(primarySelection || tvPrimaryOptions[1].value) === '最近热门' ? (
            <FilterRow label='类型'>
              {renderSelector(
                '剧集类型',
                tvSecondaryOptions,
                secondarySelection || tvSecondaryOptions[0].value,
                onSecondaryChange
              )}
            </FilterRow>
          ) : (primarySelection || tvPrimaryOptions[1].value) === '全部' ? (
            <FilterRow label='筛选'>
              <MultiLevelSelector
                key={`${type}-${primarySelection}`}
                onChange={handleMultiLevelChange}
                contentType={type}
              />
            </FilterRow>
          ) : null}
        </div>
      )}

      {type === 'anime' && (
        <div className='space-y-3 sm:space-y-4'>
          <FilterRow label='分类'>
            {renderSelector(
              '动漫分类',
              animePrimaryOptions,
              primarySelection || animePrimaryOptions[0].value,
              onPrimaryChange
            )}
          </FilterRow>

          {(primarySelection || animePrimaryOptions[0].value) === '每日放送' ? (
            <FilterRow label='星期'>
              <WeekdaySelector onWeekdayChange={onWeekdayChange} />
            </FilterRow>
          ) : (
            <FilterRow label='筛选'>
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
            </FilterRow>
          )}
        </div>
      )}

      {type === 'show' && (
        <div className='space-y-3 sm:space-y-4'>
          <FilterRow label='分类'>
            {renderSelector(
              '综艺分类',
              showPrimaryOptions,
              primarySelection || showPrimaryOptions[1].value,
              onPrimaryChange
            )}
          </FilterRow>

          {(primarySelection || showPrimaryOptions[1].value) === '最近热门' ? (
            <FilterRow label='类型'>
              {renderSelector(
                '综艺类型',
                showSecondaryOptions,
                secondarySelection || showSecondaryOptions[0].value,
                onSecondaryChange
              )}
            </FilterRow>
          ) : (primarySelection || showPrimaryOptions[1].value) === '全部' ? (
            <FilterRow label='筛选'>
              <MultiLevelSelector
                key={`${type}-${primarySelection}`}
                onChange={handleMultiLevelChange}
                contentType={type}
              />
            </FilterRow>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default DoubanSelector;
