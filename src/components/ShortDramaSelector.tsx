/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import { Skeleton } from '@heroui/react';

import { getShortDramaCategories, ShortDramaCategory } from '@/lib/shortdrama.client';

import { AppFilterSelect } from './ui/HeroPrimitives';

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

  const renderCategorySelector = () => {
    if (loading) {
      return (
        <Skeleton className='h-16 w-full' />
      );
    }

    return (
      <AppFilterSelect
        ariaLabel='短剧分类选项'
        label='分类'
        options={categories.map((category) => ({
          value: category.type_id.toString(),
          label: category.type_name,
        }))}
        value={selectedCategory}
        onChange={onCategoryChange}
      />
    );
  };

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div className='grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5'>
        {renderCategorySelector()}
      </div>
    </div>
  );
};

export default ShortDramaSelector;
