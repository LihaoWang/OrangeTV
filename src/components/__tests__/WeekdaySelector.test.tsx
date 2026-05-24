import { render, screen } from '@testing-library/react';

import WeekdaySelector from '../WeekdaySelector';

describe('WeekdaySelector', () => {
  it('renders as a select listbox and marks the current weekday as selected', () => {
    const onWeekdayChange = jest.fn();

    render(<WeekdaySelector onWeekdayChange={onWeekdayChange} />);

    const listbox = screen.getByRole('listbox', { name: '星期选项' });
    expect(listbox).toBeInTheDocument();

    const today = new Date().getDay();
    const weekdayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    expect(screen.getByRole('option', { name: weekdayMap[today] })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });
});
