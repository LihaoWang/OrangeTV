/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';

import { getShortDramaCategories, ShortDramaCategory } from '@/lib/shortdrama.client';

import { AppFilterTabs } from './ui/HeroPrimitives';

interface ShortDramaSelectorProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const ShortDramaSelector = ({
  selectedCategory,
  onCategoryChange,
}: ShortDramaSelectorProps) => {
  const [categories, setCategories] = useState<ShortDramaCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取分类数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await getShortDramaCategories();
        setCategories([
          { type_id: 0, type_name: '全部' },
          ...response.categories
        ]);
      } catch (error) {
        console.error('获取短剧分类失败:', error);
        // 设置默认分类
        setCategories([
          { type_id: 0, type_name: '全部' },
          { type_id: 1, type_name: '古装' },
          { type_id: 2, type_name: '现代' },
          { type_id: 3, type_name: '都市' },
          { type_id: 4, type_name: '言情' },
          { type_id: 5, type_name: '悬疑' },
          { type_id: 6, type_name: '喜剧' },
          { type_id: 7, type_name: '其他' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // 渲染胶囊式选择器
  const renderCapsuleSelector = () => {
    if (loading) {
      return (
        <div className='inline-flex rounded-full bg-surface-secondary p-1'>
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className='mx-0.5 h-8 w-16 rounded-full bg-surface-tertiary animate-pulse'
            />
          ))}
        </div>
      );
    }

    return (
      <AppFilterTabs
        ariaLabel='短剧分类'
        selectedKey={selectedCategory}
        onSelectionChange={onCategoryChange}
        items={categories.map((category) => ({
          key: category.type_id.toString(),
          label: category.type_name,
        }))}
      />
    );
  };

  return (
    <div className='space-y-4 sm:space-y-6'>
      {/* 分类选择 */}
      <div className='app-filter-row'>
        <span className='app-filter-label'>
          分类
        </span>
        <div className='min-w-0'>
          {renderCapsuleSelector()}
        </div>
      </div>
    </div>
  );
};

export default ShortDramaSelector;
