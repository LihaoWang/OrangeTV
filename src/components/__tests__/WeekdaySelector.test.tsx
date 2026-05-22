import { render, screen } from '@testing-library/react';

import WeekdaySelector from '../WeekdaySelector';

describe('WeekdaySelector', () => {
  it('renders as a tablist and marks the current weekday as selected', () => {
    const onWeekdayChange = jest.fn();

    render(<WeekdaySelector onWeekdayChange={onWeekdayChange} />);

    const tablist = screen.getByRole('tablist', { name: '星期筛选' });
    expect(tablist).toBeInTheDocument();

    const today = new Date().getDay();
    const weekdayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    expect(screen.getByRole('tab', { name: weekdayMap[today] })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });
});
