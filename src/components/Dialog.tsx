import { useEffect, useRef, type ReactNode } from 'react';
import { useScroll } from '../lib/motion';

interface Props {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  variant?: 'modal' | 'panel';
  className?: string;
  children: ReactNode;
}

/**
 * Native <dialog> opened with showModal(): the rest of the page becomes
 * inert (focus is trapped), Esc closes, and focus returns to whatever
 * opened it. Smooth scroll is paused while open.
 */
export function Dialog({ open, onClose, labelledBy, describedBy, variant = 'modal', className = '', children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const locked = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const scroll = useScroll();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      if (!locked.current) {
        scroll.lock();
        locked.current = true;
      }
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, scroll]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => {
      if (locked.current) {
        scroll.unlock();
        locked.current = false;
      }
      const target = returnFocus.current;
      returnFocus.current = null;
      if (target && document.contains(target)) requestAnimationFrame(() => target.focus());
      onCloseRef.current();
    };
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
      if (dialog.open) dialog.close();
      if (locked.current) {
        scroll.unlock();
        locked.current = false;
      }
    };
  }, [scroll]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-modal="true"
      data-lenis-prevent
      className={`dialog ${variant === 'panel' ? 'dialog--panel' : 'dialog--modal'} ${className}`}
      // showModal() makes the page inert, but Tab can still leave for the
      // browser UI. Wrap focus so it stays inside the dialog.
      onKeyDown={(e) => {
        if (e.key !== 'Tab') return;
        const items = Array.from(
          e.currentTarget.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => el.offsetParent !== null);
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        const current = document.activeElement;
        if (e.shiftKey && (current === first || !e.currentTarget.contains(current))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && current === last) {
          e.preventDefault();
          first.focus();
        }
      }}
      // Click on the backdrop (the <dialog> box itself, outside the inner panel) closes.
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className="dialog__panel">{children}</div>
    </dialog>
  );
}
