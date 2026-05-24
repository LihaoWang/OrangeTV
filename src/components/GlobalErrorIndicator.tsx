'use client';

import { Alert, Button } from '@heroui/react';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ErrorInfo {
  id: string;
  message: string;
  timestamp: number;
}

export function GlobalErrorIndicator() {
  const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

  useEffect(() => {
    // 监听自定义错误事件
    const handleError = (event: CustomEvent) => {
      const { message } = event.detail;
      const newError: ErrorInfo = {
        id: Date.now().toString(),
        message,
        timestamp: Date.now(),
      };

      // 如果已有错误，开始替换动画
      if (currentError) {
        setCurrentError(newError);
        setIsReplacing(true);

        // 动画完成后恢复正常
        setTimeout(() => {
          setIsReplacing(false);
        }, 200);
      } else {
        // 第一次显示错误
        setCurrentError(newError);
      }

      setIsVisible(true);
    };

    // 监听错误事件
    window.addEventListener('globalError', handleError as EventListener);

    return () => {
      window.removeEventListener('globalError', handleError as EventListener);
    };
  }, [currentError]);

  const handleClose = () => {
    setIsVisible(false);
    setCurrentError(null);
    setIsReplacing(false);
  };

  if (!isVisible || !currentError) {
    return null;
  }

  return (
    <div className='fixed top-4 right-4 z-[2000]'>
      <Alert
        status='danger'
        className={`min-w-[300px] max-w-[400px] transition-transform duration-300 ${
          isReplacing ? 'scale-105' : 'scale-100'
        }`}
      >
        <Alert.Content>
          <Alert.Description>{currentError.message}</Alert.Description>
        </Alert.Content>
        <Button
          isIconOnly
          size='sm'
          variant='ghost'
          onPress={handleClose}
          aria-label='关闭错误提示'
        >
          <X className='h-4 w-4' />
        </Button>
      </Alert>
    </div>
  );
}

// 全局错误触发函数
export function triggerGlobalError(message: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('globalError', {
        detail: { message },
      })
    );
  }
}
