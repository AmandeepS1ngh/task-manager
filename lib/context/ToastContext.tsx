'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

// ─── Types ────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

// ─── Context ──────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    // Start exit animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    // Remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto-dismiss after 3s
      setTimeout(() => removeToast(id), 3000);
    },
    [removeToast]
  );

  const colors: Record<ToastType, string> = {
    success: 'border-l-[var(--color-success)] bg-[var(--color-surface)]',
    error: 'border-l-[var(--color-danger)] bg-[var(--color-surface)]',
    info: 'border-l-[var(--color-primary)] bg-[var(--color-surface)]',
  };

  const icons: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container — bottom-right */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              ${colors[toast.type]}
              ${toast.exiting ? 'animate-toast-out' : 'animate-toast-in'}
              border-l-4 px-4 py-3 rounded-lg shadow-xl
              flex items-start gap-3 cursor-pointer
              text-[var(--color-text)] text-sm
            `}
            onClick={() => removeToast(toast.id)}
          >
            <span className="text-base mt-0.5">{icons[toast.type]}</span>
            <p className="flex-1">{toast.message}</p>
            <button
              className="text-[var(--color-muted)] hover:text-[var(--color-text)] text-lg leading-none"
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
