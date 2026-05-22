import { fireEvent, render, screen } from '@testing-library/react';

import SearchResultFilter, {
  SearchFilterCategory,
} from '../SearchResultFilter';

const categories: SearchFilterCategory[] = [
  {
    key: 'source',
    label: '来源',
    options: [
      { label: '全部来源', value: 'all' },
      { label: '稳定源', value: 'stable' },
    ],
  },
  {
    key: 'title',
    label: '标题',
    options: [
      { label: '全部标题', value: 'all' },
      { label: '精确匹配', value: 'exact' },
    ],
  },
];

describe('SearchResultFilter', () => {
  it('opens an options menu and applies the selected option', () => {
    const onChange = jest.fn();

    render(
      <SearchResultFilter
        categories={categories}
        values={{ source: 'all', title: 'all', yearOrder: 'none' }}
        onChange={onChange}
      />
    );

    expect(screen.getByRole('menu', { name: '来源筛选' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: '稳定源' }));

    expect(onChange).toHaveBeenCalledWith({
      source: 'stable',
      title: 'all',
      year: 'all',
      yearOrder: 'none',
    });
  });

  it('cycles year ordering when the year button is clicked repeatedly', () => {
    const onChange = jest.fn();

    const { rerender } = render(
      <SearchResultFilter
        categories={categories}
        values={{ source: 'all', title: 'all', yearOrder: 'none' }}
        onChange={onChange}
      />
    );

    const yearButton = screen.getByRole('button', { name: '按年份排序排序' });
    fireEvent.click(yearButton);

    expect(onChange).toHaveBeenLastCalledWith({
      source: 'all',
      title: 'all',
      year: 'all',
      yearOrder: 'desc',
    });

    rerender(
      <SearchResultFilter
        categories={categories}
        values={{ source: 'all', title: 'all', yearOrder: 'desc' }}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '按年份降序排序' }));

    expect(onChange).toHaveBeenLastCalledWith({
      source: 'all',
      title: 'all',
      year: 'all',
      yearOrder: 'asc',
    });
  });
});
