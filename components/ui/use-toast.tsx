'use client';

import { createContext, useContext, useState } from 'react';

export type Toast = {
  id: string;
  title: string;
  description?: string;
  /**
   * Support both the simplified `type` field we use across the app and the
   * legacy shadcn-style `variant` field so that accidental `variant` usages do
   * not break type-checks during builds.
   */
  type?: 'default' | 'error';
  variant?: 'default' | 'destructive';
};

const ToastContext = createContext<{ toasts: Toast[]; push: (toast: Omit<Toast, 'id'>) => void }>({
  toasts: [],
  push: () => undefined,
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };
  return <ToastContext.Provider value={{ toasts, push }}>{children}</ToastContext.Provider>;
}

export function useToast() {
  return useContext(ToastContext);
}
