'use client';

import { useToast } from './use-toast';

export function Toaster() {
  const { toasts } = useToast();
  return (
    <div className="fixed left-4 bottom-4 space-y-2 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded border bg-white shadow px-4 py-2 text-sm ${
            toast.type === 'error' || toast.variant === 'destructive'
              ? 'border-destructive text-destructive'
              : 'border-foreground/20'
          }`}
        >
          <div className="font-semibold">{toast.title}</div>
          {toast.description && <div className="text-foreground/70">{toast.description}</div>}
        </div>
      ))}
    </div>
  );
}
