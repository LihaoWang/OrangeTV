import { fireEvent, render, screen } from '@testing-library/react';

import MultiLevelSelector from '../MultiLevelSelector';

describe('MultiLevelSelector', () => {
  it('applies selected filter values through accessible listbox options', () => {
    const onChange = jest.fn();

    render(<MultiLevelSelector contentType='movie' onChange={onChange} />);

    expect(screen.getByRole('listbox', { name: '类型选项' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: '喜剧' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: '喜剧',
        region: 'all',
        year: 'all',
        sort: 'T',
      })
    );
  });
});
