import { useState, useCallback } from 'react';
import { Toast } from '@/components/ui/toast';

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback(({ message, type = 'success', duration = 3000 }) => {
    setToast({ message, type });
    
    if (duration > 0) {
      setTimeout(() => {
        setToast(null);
      }, duration);
    }
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const success = useCallback((message, duration) => {
    showToast({ message, type: 'success', duration });
  }, [showToast]);

  const error = useCallback((message, duration) => {
    showToast({ message, type: 'error', duration });
  }, [showToast]);

  const warning = useCallback((message, duration) => {
    showToast({ message, type: 'warning', duration });
  }, [showToast]);

  const ToastComponent = toast ? (
    <Toast
      key={Date.now()}
      message={toast.message}
      type={toast.type}
      onClose={hideToast}
    />
  ) : null;

  return {
    toast: {
      success,
      error,
      warning,
    },
    ToastComponent,
    hideToast,
  };
}
