'use client';

import React, { useMemo } from 'react';

import { AppFilterSelect } from './ui/HeroPrimitives';

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

const YEAR_ORDER_OPTIONS: SearchFilterOption[] = [
  { label: '默认排序', value: 'none' },
  { label: '年份降序', value: 'desc' },
  { label: '年份升序', value: 'asc' },
];

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

  return (
    <div className='grid max-w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
      {categories.map((category) => (
        <AppFilterSelect
          key={category.key}
          ariaLabel={`${category.label}选项`}
          label={category.label}
          options={category.options}
          value={mergedValues[category.key]}
          onChange={(value) => handleOptionSelect(category.key, value)}
        />
      ))}
      <AppFilterSelect
        ariaLabel='排序选项'
        label='排序'
        options={YEAR_ORDER_OPTIONS}
        value={mergedValues.yearOrder}
        onChange={(value) => onChange({ ...mergedValues, yearOrder: value })}
      />
    </div>
  );
};

export default SearchResultFilter;
