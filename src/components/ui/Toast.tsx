// src/components/ui/Toast.tsx
// Système de notifications toast pour remplacer les alert() natifs
// Utilisé dans tout le module 3

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id:       string;
  type:     ToastType;
  title:    string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  success: (title: string, message?: string) => void;
  error:   (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info:    (title: string, message?: string) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

// ── Config visuelle ────────────────────────────────────────────────────────────
const TOAST_CONFIG: Record<ToastType, {
  icon:    React.ElementType;
  bg:      string;
  border:  string;
  iconCls: string;
  titleCls: string;
}> = {
  success: {
    icon:     CheckCircle,
    bg:       'bg-green-50',
    border:   'border-green-200',
    iconCls:  'text-green-500',
    titleCls: 'text-green-800',
  },
  error: {
    icon:     XCircle,
    bg:       'bg-red-50',
    border:   'border-red-200',
    iconCls:  'text-red-500',
    titleCls: 'text-red-800',
  },
  warning: {
    icon:     AlertTriangle,
    bg:       'bg-yellow-50',
    border:   'border-yellow-200',
    iconCls:  'text-yellow-500',
    titleCls: 'text-yellow-800',
  },
  info: {
    icon:     Info,
    bg:       'bg-blue-50',
    border:   'border-blue-200',
    iconCls:  'text-blue-500',
    titleCls: 'text-blue-800',
  },
};

// ── Item individuel ────────────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const cfg = TOAST_CONFIG[toast.type];
  const Icon = cfg.icon;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm w-full ${cfg.bg} ${cfg.border} animate-in slide-in-from-right`}>
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${cfg.iconCls}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${cfg.titleCls}`}>{toast.title}</p>
        {toast.message && (
          <p className="text-sm text-gray-600 mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Provider ───────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) =>
    setToasts(ts => ts.filter(t => t.id !== id)), []);

  const add = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(ts => [...ts.slice(-4), { id, type, title, message, duration }]);
  }, []);

  const ctx: ToastContextType = {
    success: (t, m) => add('success', t, m),
    error:   (t, m) => add('error',   t, m, 6000),
    warning: (t, m) => add('warning', t, m),
    info:    (t, m) => add('info',    t, m),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Conteneur toast — coin bas droite */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}