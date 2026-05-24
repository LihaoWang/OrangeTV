import { fireEvent, render, screen } from '@testing-library/react';

import { AppButton, AppDialog, AppDrawer, AppTabs } from '../HeroPrimitives';

describe('HeroPrimitives', () => {
  it('invokes AppButton actions through an accessible button', () => {
    const onPress = jest.fn();

    render(<AppButton onPress={onPress}>刷新</AppButton>);

    fireEvent.click(screen.getByRole('button', { name: '刷新' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders AppTabs as an accessible tablist and changes selection', () => {
    const onChange = jest.fn();

    render(
      <AppTabs
        ariaLabel='内容切换'
        selectedKey='home'
        onSelectionChange={onChange}
        items={[
          { key: 'home', label: '首页' },
          { key: 'favorites', label: '收藏夹' },
        ]}
      />
    );

    expect(screen.getByRole('tablist', { name: '内容切换' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '首页' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    fireEvent.click(screen.getByRole('tab', { name: '收藏夹' }));

    expect(onChange).toHaveBeenCalledWith('favorites');
  });

  it('renders controlled dialogs with accessible roles and close actions', () => {
    const onOpenChange = jest.fn();

    render(
      <AppDialog
        isOpen
        title='删除记录'
        description='确认删除这条播放记录'
        onOpenChange={onOpenChange}
        footer={<AppButton onPress={() => onOpenChange(false)}>取消</AppButton>}
      >
        <p>删除后无法恢复</p>
      </AppDialog>
    );

    expect(screen.getByRole('dialog', { name: '删除记录' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders controlled drawers with accessible roles and close actions', () => {
    const onOpenChange = jest.fn();

    render(
      <AppDrawer isOpen title='更多操作' onOpenChange={onOpenChange}>
        <AppButton onPress={() => onOpenChange(false)}>播放</AppButton>
      </AppDrawer>
    );

    expect(screen.getByRole('dialog', { name: '更多操作' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '播放' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('clears stale root scroll locks when dialogs unmount', () => {
    const onOpenChange = jest.fn();
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const { unmount } = render(
      <AppDialog isOpen title='提示' onOpenChange={onOpenChange}>
        <p>内容</p>
      </AppDialog>
    );

    unmount();

    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.overflow).toBe('');
  });

  it('clears stale root scroll locks when drawers unmount', () => {
    const onOpenChange = jest.fn();
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const { unmount } = render(
      <AppDrawer isOpen title='更多操作' onOpenChange={onOpenChange}>
        <p>内容</p>
      </AppDrawer>
    );

    unmount();

    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.overflow).toBe('');
  });
});
