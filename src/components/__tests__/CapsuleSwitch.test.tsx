import { fireEvent, render, screen } from '@testing-library/react';

import CapsuleSwitch from '../CapsuleSwitch';

describe('CapsuleSwitch', () => {
  it('renders as a tablist with the active option selected', () => {
    render(
      <CapsuleSwitch
        options={[
          { label: '首页', value: 'home' },
          { label: '收藏夹', value: 'favorites' },
        ]}
        active='favorites'
        onChange={() => {}}
      />
    );

    const tablist = screen.getByRole('tablist', { name: '内容切换' });
    expect(tablist).toBeInTheDocument();

    expect(screen.getByRole('tab', { name: '首页' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
    expect(screen.getByRole('tab', { name: '收藏夹' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('calls onChange when a different tab is activated', () => {
    const onChange = jest.fn();

    render(
      <CapsuleSwitch
        options={[
          { label: '首页', value: 'home' },
          { label: '收藏夹', value: 'favorites' },
        ]}
        active='home'
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: '收藏夹' }));

    expect(onChange).toHaveBeenCalledWith('favorites');
  });
});
