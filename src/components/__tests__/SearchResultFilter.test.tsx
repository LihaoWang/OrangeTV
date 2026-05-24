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
  it('applies selected options through accessible listbox options', () => {
    const onChange = jest.fn();

    render(
      <SearchResultFilter
        categories={categories}
        values={{ source: 'all', title: 'all', yearOrder: 'none' }}
        onChange={onChange}
      />
    );

    expect(screen.getByRole('listbox', { name: '来源选项' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: '稳定源' }));

    expect(onChange).toHaveBeenCalledWith({
      source: 'stable',
      title: 'all',
      year: 'all',
      yearOrder: 'none',
    });
  });

  it('applies year ordering from the same select pattern', () => {
    const onChange = jest.fn();

    render(
      <SearchResultFilter
        categories={categories}
        values={{ source: 'all', title: 'all', yearOrder: 'none' }}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('option', { name: '年份降序' }));

    expect(onChange).toHaveBeenLastCalledWith({
      source: 'all',
      title: 'all',
      year: 'all',
      yearOrder: 'desc',
    });
  });
});
