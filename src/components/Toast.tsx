'use client';

import { Toast as HeroToast } from '@heroui/react';
import React, { createContext, useCallback, useContext, useMemo } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Toast) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

const showHeroToast = ({ type, title, message, duration }: Toast) => {
  const options = {
    description: message,
    timeout: duration,
  };

  switch (type) {
    case 'success':
      HeroToast.toast.success(title, options);
      break;
    case 'error':
      HeroToast.toast.danger(title, options);
      break;
    case 'warning':
      HeroToast.toast.warning(title, options);
      break;
    case 'info':
    default:
      HeroToast.toast.info(title, options);
      break;
  }
};

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const showToast = useCallback((toast: Toast) => {
    showHeroToast(toast);
  }, []);

  const showSuccess = useCallback(
    (title: string, message?: string) =>
      showToast({ type: 'success', title, message }),
    [showToast]
  );

  const showError = useCallback(
    (title: string, message?: string) =>
      showToast({ type: 'error', title, message }),
    [showToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string) =>
      showToast({ type: 'warning', title, message }),
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string) =>
      showToast({ type: 'info', title, message }),
    [showToast]
  );

  const contextValue = useMemo<ToastContextType>(
    () => ({
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
    }),
    [showError, showInfo, showSuccess, showToast, showWarning]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <HeroToast.Provider placement='top end' />
    </ToastContext.Provider>
  );
};
