import { fireEvent, render, screen } from '@testing-library/react';

import { AnnouncementBanner } from '../AnnouncementBanner';

describe('AnnouncementBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  });

  it('renders a non-blocking announcement without a dialog or scroll lock', () => {
    const onDismiss = jest.fn();

    render(
      <AnnouncementBanner
        announcement='请注意站点公告'
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText('请注意站点公告')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.overflow).toBe('');

    fireEvent.click(screen.getByRole('button', { name: '我知道了' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
