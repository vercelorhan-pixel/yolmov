import { useState, useCallback } from 'react';
import { ToastType } from '../components/shared/Toast';

interface ToastState {
  isVisible: boolean;
  message: string;
  type: ToastType;
  duration: number;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: '',
    type: 'success',
    duration: 3000,
  });

  const showToast = useCallback((
    message: string, 
    type: ToastType = 'success', 
    duration: number = 3000
  ) => {
    setToast({
      isVisible: true,
      message,
      type,
      duration,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
};
