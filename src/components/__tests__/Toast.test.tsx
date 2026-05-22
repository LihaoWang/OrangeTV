import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';

import { ToastProvider, useToast } from '../Toast';

function ToastProbe() {
  const toast = useToast();

  useEffect(() => {
    toast.showSuccess('保存成功', '配置已更新');
  }, [toast]);

  return null;
}

describe('ToastProvider', () => {
  it('renders the HeroUI toast provider and preserves the toast hook API', () => {
    render(
      <ToastProvider>
        <ToastProbe />
      </ToastProvider>
    );

    expect(screen.getByTestId('heroui-toast-provider')).toBeInTheDocument();
  });
});
