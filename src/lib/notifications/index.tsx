import React, { createContext, useCallback, useContext, useState } from 'react';

export type ToastVariant = 'success' | 'danger' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface NotificationContextValue {
  notify: (message: string, variant?: ToastVariant) => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notify: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 88,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: 'min(360px, 90vw)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`alert alert-${t.variant} mb-0 py-2 px-3`}
            style={{ borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,.15)', fontSize: 14 }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  return useContext(NotificationContext).notify;
}
