import { useCallback, useEffect, useRef, useState } from 'react';

import { AppToastType } from '@/components/ui/app-toast';

type ToastState = {
  message: string;
  type: AppToastType;
};

export function useAppToast(duration = 2600) {
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback((nextToast: ToastState) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast(nextToast);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, duration);
  }, [duration]);

  return {
    showToast,
    toast,
  };
}
