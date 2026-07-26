import { useCallback, useEffect, useRef, useState } from 'react';
import { Toast } from '@/components/ui/toast';

const DEFAULT_DURATIONS = {
  success: 4500,
  error: 8000,
  warning: 7000,
  info: 6000,
};

export function useToast() {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);
  const toastIdRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const hideToast = useCallback(() => {
    clearTimer();
    setToast(null);
  }, [clearTimer]);

  const showToast = useCallback(({
    message,
    title,
    description,
    details,
    type = 'success',
    duration,
  }) => {
    clearTimer();

    const id = ++toastIdRef.current;
    const resolvedDuration = duration ?? DEFAULT_DURATIONS[type] ?? DEFAULT_DURATIONS.info;
    setToast({
      id,
      message: String(message || ''),
      title,
      description,
      details,
      type,
    });

    if (resolvedDuration > 0) {
      timeoutRef.current = window.setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
        timeoutRef.current = null;
      }, resolvedDuration);
    }
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const notify = useCallback((value, type, duration) => {
    const options = value && typeof value === 'object'
      ? value
      : { message: value };
    showToast({
      ...options,
      type,
      duration: duration ?? options.duration,
    });
  }, [showToast]);

  const success = useCallback(
    (value, duration) => notify(value, 'success', duration),
    [notify]
  );
  const error = useCallback(
    (value, duration) => notify(value, 'error', duration),
    [notify]
  );
  const warning = useCallback(
    (value, duration) => notify(value, 'warning', duration),
    [notify]
  );
  const info = useCallback(
    (value, duration) => notify(value, 'info', duration),
    [notify]
  );

  const ToastComponent = toast ? (
    <Toast
      key={toast.id}
      message={toast.message}
      title={toast.title}
      description={toast.description}
      details={toast.details}
      type={toast.type}
      onClose={hideToast}
    />
  ) : null;

  return {
    toast: {
      success,
      error,
      warning,
      info,
    },
    ToastComponent,
    hideToast,
  };
}
