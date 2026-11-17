import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';

type Tone = 'success' | 'error';
interface Toast { id: number; tone: Tone; message: string }
interface ToastApi { success: (m: string) => void; error: (m: string) => void }

const ToastContext = createContext<ToastApi | null>(null);

/** Short status messages. Success is announced politely, errors assertively. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (tone: Tone, message: string) => {
      const id = next.current++;
      setToasts((all) => [...all.slice(-2), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), tone === 'error' ? 9000 : 5000);
    },
    [dismiss],
  );
  const api = useMemo<ToastApi>(() => ({ success: (m) => push('success', m), error: (m) => push('error', m) }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack">
        <div role="status" aria-live="polite" className="contents">
          {toasts.filter((x) => x.tone === 'success').map((x) => <ToastItem key={x.id} toast={x} onClose={dismiss} label={t('admin.toast.close')} />)}
        </div>
        <div role="alert" aria-live="assertive" className="contents">
          {toasts.filter((x) => x.tone === 'error').map((x) => <ToastItem key={x.id} toast={x} onClose={dismiss} label={t('admin.toast.close')} />)}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose, label }: { toast: Toast; onClose: (id: number) => void; label: string }) {
  return (
    <div className={`toast toast--${toast.tone}`}>
      <Icon name={toast.tone === 'success' ? 'check-circle-linear' : 'danger-circle-linear'} className="h-5 w-5 shrink-0" />
      <p className="flex-1">{toast.message}</p>
      <button type="button" className="toast__close" aria-label={label} onClick={() => onClose(toast.id)}>
        <Icon name="close-circle-linear" className="h-5 w-5" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
