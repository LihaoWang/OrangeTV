import { fireEvent, render, screen } from '@testing-library/react';

import MultiLevelSelector from '../MultiLevelSelector';

describe('MultiLevelSelector', () => {
  it('applies selected filter values through accessible menu items', () => {
    const onChange = jest.fn();

    render(<MultiLevelSelector contentType='movie' onChange={onChange} />);

    fireEvent.click(screen.getByRole('menuitem', { name: '喜剧' }));

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
