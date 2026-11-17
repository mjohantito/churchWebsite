// Reusable building blocks for every admin screen.
import { useEffect, useId, useRef, useState, type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { Dialog } from '../components/Dialog';
import { Markdown } from '../lib/markdown';

/* ------------------------------------------------------------------ */
/* Page frame                                                           */
/* ------------------------------------------------------------------ */

export function PageHead({ title, back, actions, children }: { title: string; back?: { to: string; label: string }; actions?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-6 sm:mb-8">
      {back && (
        <Link to={back.to} className="admin-back">
          <Icon name="arrow-left-linear" className="h-4 w-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="admin-title" tabIndex={-1} id="admin-page-title">
          {title}
        </h1>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-3 max-w-2xl text-stone-600">{children}</div>}
    </header>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`admin-card ${className}`}>{children}</section>;
}

/* ------------------------------------------------------------------ */
/* Buttons                                                              */
/* ------------------------------------------------------------------ */

type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export function Button({
  variant = 'secondary', busy = false, icon, children, className = '', type = 'button', disabled, ...rest
}: { variant?: BtnVariant; busy?: boolean; icon?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`abtn abtn--${variant} ${className}`}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...rest}
    >
      {busy ? <span className="spinner spinner--ink" aria-hidden="true" /> : icon ? <Icon name={icon} className="h-5 w-5" /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({ to, icon, children, variant = 'secondary' }: { to: string; icon?: string; children: ReactNode; variant?: BtnVariant }) {
  return (
    <Link to={to} className={`abtn abtn--${variant}`}>
      {icon && <Icon name={icon} className="h-5 w-5" />}
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Fields                                                               */
/* ------------------------------------------------------------------ */

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
  className?: string;
}

/** Label + control + hint + error, wired with ids for screen readers. */
export function Field({ label, required, hint, error, children, className = '' }: FieldProps) {
  const { t } = useTranslation();
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        <span className="field-flag">{required ? t('admin.common.required') : t('admin.common.optional')}</span>
      </label>
      {children({ id, describedBy: [hintId, errId].filter(Boolean).join(' ') || undefined, invalid: Boolean(error) })}
      {hint && <p id={hintId} className="field-hint">{hint}</p>}
      {error && <p id={errId} className="field-error">{error}</p>}
    </div>
  );
}

type Base = { label: string; required?: boolean; hint?: ReactNode; error?: string; className?: string };

export function TextField({ label, required, hint, error, className, value, onChange, ...rest }: Base & { value: string; onChange: (v: string) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <Field label={label} required={required} hint={hint} error={error} className={className}>
      {({ id, describedBy, invalid }) => (
        <input id={id} className="field-control" value={value} aria-describedby={describedBy} aria-invalid={invalid || undefined}
          aria-required={required || undefined} onChange={(e) => onChange(e.target.value)} {...rest} />
      )}
    </Field>
  );
}

export function TextArea({ label, required, hint, error, className, value, onChange, rows = 5, ...rest }: Base & { value: string; onChange: (v: string) => void } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'>) {
  return (
    <Field label={label} required={required} hint={hint} error={error} className={className}>
      {({ id, describedBy, invalid }) => (
        <textarea id={id} className="field-control" rows={rows} value={value} aria-describedby={describedBy} aria-invalid={invalid || undefined}
          aria-required={required || undefined} onChange={(e) => onChange(e.target.value)} {...rest} />
      )}
    </Field>
  );
}

export function SelectField({ label, required, hint, error, className, value, onChange, options, ...rest }: Base & { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] } & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'>) {
  return (
    <Field label={label} required={required} hint={hint} error={error} className={className}>
      {({ id, describedBy, invalid }) => (
        <select id={id} className="field-control" value={value} aria-describedby={describedBy} aria-invalid={invalid || undefined}
          onChange={(e) => onChange(e.target.value)} {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}
    </Field>
  );
}

/** Textarea with a light formatting syntax and a live preview. */
export function MarkdownField({ label, required, hint, error, value, onChange, rows = 8, lang }: Base & { value: string; onChange: (v: string) => void; rows?: number; lang?: string }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const tabsId = useId();
  return (
    <Field label={label} required={required} error={error}
      hint={<>{hint}{hint ? ' ' : ''}{t('admin.markdown.help')}</>}>
      {({ id, describedBy, invalid }) => (
        <div className="md-field">
          <div role="tablist" aria-label={t('admin.markdown.modeLabel', { label })} className="md-tabs">
            {(['write', 'preview'] as const).map((k) => (
              <button key={k} type="button" role="tab" id={`${tabsId}-${k}`} aria-selected={tab === k}
                aria-controls={`${tabsId}-${k}-panel`} className="md-tab" onClick={() => setTab(k)}>
                {t(`admin.markdown.${k}`)}
              </button>
            ))}
          </div>
          <div id={`${tabsId}-write-panel`} role="tabpanel" aria-labelledby={`${tabsId}-write`} hidden={tab !== 'write'}>
            <textarea id={id} className="field-control md-textarea" rows={rows} value={value} lang={lang}
              aria-describedby={describedBy} aria-invalid={invalid || undefined} aria-required={required || undefined}
              onChange={(e) => onChange(e.target.value)} />
          </div>
          <div id={`${tabsId}-preview-panel`} role="tabpanel" aria-labelledby={`${tabsId}-preview`} hidden={tab !== 'preview'} className="md-preview" lang={lang}>
            {value.trim() ? <Markdown text={value} /> : <p className="text-stone-500">{t('admin.markdown.emptyPreview')}</p>}
          </div>
        </div>
      )}
    </Field>
  );
}

/**
 * Indonesian (required) + English (optional) versions of one field,
 * side by side on wide screens and stacked on phones.
 */
export function Bilingual({ render }: { render: (lang: 'id' | 'en') => ReactNode }) {
  const { t } = useTranslation();
  return (
    <fieldset className="bilingual">
      <div>
        <p className="lang-pill" aria-hidden="true">ID</p>
        {render('id')}
      </div>
      <div>
        <p className="lang-pill lang-pill--muted" aria-hidden="true">EN</p>
        {render('en')}
        <p className="field-hint">{t('admin.lang.enHint')}</p>
      </div>
    </fieldset>
  );
}

/**
 * Indonesian / English as tabs (one language visible at a time). Arrow keys
 * move between tabs. Switches to the tab that has an error after a failed save.
 */
export function BilingualTabs({ render, errorIn }: { render: (lang: 'id' | 'en') => ReactNode; errorIn?: 'id' | 'en' | null }) {
  const { t } = useTranslation();
  const base = useId();
  const [tab, setTab] = useState<'id' | 'en'>('id');
  const refs = { id: useRef<HTMLButtonElement>(null), en: useRef<HTMLButtonElement>(null) };
  useEffect(() => {
    if (errorIn) setTab(errorIn);
  }, [errorIn]);
  const langs = ['id', 'en'] as const;
  return (
    <div>
      <div role="tablist" aria-label={t('admin.lang.tabs')} className="lang-tabs">
        {langs.map((l) => (
          <button key={l} ref={refs[l]} type="button" role="tab" id={`${base}-${l}`} aria-controls={`${base}-${l}-panel`}
            aria-selected={tab === l} tabIndex={tab === l ? 0 : -1} className="lang-tab"
            onClick={() => setTab(l)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const next = l === 'id' ? 'en' : 'id';
                setTab(next);
                refs[next].current?.focus();
              }
            }}>
            {t(l === 'id' ? 'admin.lang.idTab' : 'admin.lang.enTab')}
          </button>
        ))}
      </div>
      {langs.map((l) => (
        <div key={l} role="tabpanel" id={`${base}-${l}-panel`} aria-labelledby={`${base}-${l}`} hidden={tab !== l} className="space-y-5 pt-4">
          {render(l)}
          {l === 'en' && <p className="field-hint">{t('admin.lang.enHint')}</p>}
        </div>
      ))}
    </div>
  );
}

/** On/off switch (button with role="switch"). */
export function Switch({ checked, onChange, label, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} className="switch" onClick={() => onChange(!checked)}>
      <span className="switch__track" aria-hidden="true"><span className="switch__thumb" /></span>
      <span>{label}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Status                                                               */
/* ------------------------------------------------------------------ */

export function StatusBadge({ status }: { status: 'draft' | 'published' }) {
  const { t } = useTranslation();
  return <span className={`badge ${status === 'published' ? 'badge--ok' : 'badge--muted'}`}>{t(`admin.common.${status}`)}</span>;
}

/* ------------------------------------------------------------------ */
/* Confirm                                                              */
/* ------------------------------------------------------------------ */

export function ConfirmDialog({
  open, title, body, confirmLabel, cancelLabel, danger = false, busy = false, onConfirm, onCancel,
}: { open: boolean; title: string; body: string; confirmLabel: string; cancelLabel: string; danger?: boolean; busy?: boolean; onConfirm: () => void; onCancel: () => void }) {
  // Unique ids: a screen often renders two confirm dialogs (delete + unsaved changes).
  const id = useId();
  return (
    <Dialog open={open} onClose={onCancel} labelledBy={`${id}-title`} describedBy={`${id}-body`}>
      <div className="px-6 pb-6 pt-7 sm:px-8">
        <h2 id={`${id}-title`} className="confirm-title text-xl font-bold">{title}</h2>
        <p id={`${id}-body`} className="mt-2 text-stone-700">{body}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button onClick={onCancel} autoFocus>{cancelLabel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} busy={busy} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Misc                                                                 */
/* ------------------------------------------------------------------ */

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
