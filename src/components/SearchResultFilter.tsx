'use client';

import { Dropdown, Label, ScrollShadow } from '@heroui/react';
import { ArrowDownWideNarrow, ArrowUpDown, ArrowUpNarrowWide } from 'lucide-react';
import React, { useMemo } from 'react';

import { AppButton } from './ui/HeroPrimitives';

export type SearchFilterKey = 'source' | 'title' | 'year' | 'yearOrder';

export interface SearchFilterOption {
  label: string;
  value: string;
}

export interface SearchFilterCategory {
  key: SearchFilterKey;
  label: string;
  options: SearchFilterOption[];
}

interface SearchResultFilterProps {
  categories: SearchFilterCategory[];
  values: Partial<Record<SearchFilterKey, string>>;
  onChange: (values: Record<SearchFilterKey, string>) => void;
}

const DEFAULTS: Record<SearchFilterKey, string> = {
  source: 'all',
  title: 'all',
  year: 'all',
  yearOrder: 'none',
};

const SearchResultFilter: React.FC<SearchResultFilterProps> = ({ categories, values, onChange }) => {
  const mergedValues = useMemo(() => {
    return {
      ...DEFAULTS,
      ...values,
    } as Record<SearchFilterKey, string>;
  }, [values]);

  const handleOptionSelect = (categoryKey: SearchFilterKey, optionValue: string) => {
    const newValues = {
      ...mergedValues,
      [categoryKey]: optionValue,
    } as Record<SearchFilterKey, string>;
    onChange(newValues);
  };

  const getDisplayText = (categoryKey: SearchFilterKey) => {
    const category = categories.find((cat) => cat.key === categoryKey);
    if (!category) return '';
    const value = mergedValues[categoryKey];
    if (!value || value === DEFAULTS[categoryKey]) return category.label;
    const option = category.options.find((opt) => opt.value === value);
    return option?.label || category.label;
  };

  const isDefaultValue = (categoryKey: SearchFilterKey) => {
    const value = mergedValues[categoryKey];
    return !value || value === DEFAULTS[categoryKey];
  };

  const isOptionSelected = (categoryKey: SearchFilterKey, optionValue: string) => {
    const value = mergedValues[categoryKey] ?? DEFAULTS[categoryKey];
    return value === optionValue;
  };

  return (
    <div className='app-search-filter-bar'>
        {categories.map((category) => (
          <Dropdown key={category.key}>
            <AppButton
              variant='tertiary'
              className={`app-search-filter-trigger ${
                isDefaultValue(category.key) ? '' : 'app-search-filter-trigger-active'
              }`}
            >
              <span>{getDisplayText(category.key)}</span>
              <svg className='inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5 sm:ml-1 transition-transform duration-200' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
              </svg>
            </AppButton>
            <Dropdown.Popover className='app-search-filter-popover'>
              <ScrollShadow className='app-search-filter-scroll'>
                <Dropdown.Menu
                  aria-label={`${category.label}筛选`}
                  selectionMode='single'
                  selectedKeys={new Set([mergedValues[category.key]])}
                  onAction={(key) => handleOptionSelect(category.key, String(key))}
                  className='app-search-filter-menu'
                >
                  {category.options.map((option) => (
                    <Dropdown.Item
                      key={option.value}
                      id={option.value}
                      textValue={option.label}
                      className={
                        isOptionSelected(category.key, option.value)
                          ? 'app-search-filter-option-active'
                          : 'app-search-filter-option'
                      }
                    >
                      <Label className='app-search-filter-option-label'>
                        {option.label}
                      </Label>
                      <Dropdown.ItemIndicator />
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </ScrollShadow>
            </Dropdown.Popover>
          </Dropdown>
        ))}
        {/* 通用年份排序切换按钮 */}
        <div className='relative'>
          <AppButton
            variant='ghost'
            onPress={() => {
              let next;
              switch (mergedValues.yearOrder) {
                case 'none':
                  next = 'desc';
                  break;
                case 'desc':
                  next = 'asc';
                  break;
                case 'asc':
                  next = 'none';
                  break;
                default:
                  next = 'desc';
              }
              onChange({ ...mergedValues, yearOrder: next });
            }}
            className={`app-search-filter-trigger ${
              mergedValues.yearOrder === 'none'
                ? ''
                : 'app-search-filter-trigger-active'
            }`}
            aria-label={`按年份${mergedValues.yearOrder === 'none' ? '排序' : mergedValues.yearOrder === 'desc' ? '降序' : '升序'}排序`}
          >
            <span>年份</span>
            {mergedValues.yearOrder === 'none' ? (
              <ArrowUpDown className='inline-block ml-1 w-4 h-4 sm:w-4 sm:h-4' />
            ) : mergedValues.yearOrder === 'desc' ? (
              <ArrowDownWideNarrow className='inline-block ml-1 w-4 h-4 sm:w-4 sm:h-4' />
            ) : (
              <ArrowUpNarrowWide className='inline-block ml-1 w-4 h-4 sm:w-4 sm:h-4' />
            )}
          </AppButton>
        </div>
    </div>
  );
};

export default SearchResultFilter;
