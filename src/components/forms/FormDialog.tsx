import { createContext, useCallback, useContext, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '../Dialog';
import { Icon } from '../Icon';
import { submitForm, type FormType } from '../../lib/submitForm';

/* ------------------------------------------------------------------ */
/* Field definitions per form                                          */
/* ------------------------------------------------------------------ */

type FieldName = 'name' | 'phone' | 'email' | 'message' | 'request' | 'voicePart';

interface FieldDef {
  name: FieldName;
  kind: 'text' | 'tel' | 'email' | 'textarea' | 'select';
  required: boolean;
  autoComplete?: string;
  hint?: 'phone' | 'request';
}

const NAME: FieldDef = { name: 'name', kind: 'text', required: true, autoComplete: 'name' };
const PHONE: FieldDef = { name: 'phone', kind: 'tel', required: true, autoComplete: 'tel', hint: 'phone' };
const EMAIL: FieldDef = { name: 'email', kind: 'email', required: false, autoComplete: 'email' };

const FORMS: Record<FormType, { i18n: 'newMember' | 'prayer' | 'choir'; fields: FieldDef[] }> = {
  new_member: {
    i18n: 'newMember',
    fields: [NAME, PHONE, EMAIL, { name: 'message', kind: 'textarea', required: false }],
  },
  prayer_request: {
    i18n: 'prayer',
    fields: [NAME, PHONE, EMAIL, { name: 'request', kind: 'textarea', required: true, hint: 'request' }],
  },
  choir_signup: {
    i18n: 'choir',
    fields: [NAME, PHONE, EMAIL, { name: 'voicePart', kind: 'select', required: false }],
  },
};

const VOICE_PARTS = ['none', 'soprano', 'alto', 'tenor', 'bass'] as const;

type Values = Partial<Record<FieldName, string>>;
type Errors = Partial<Record<FieldName, string>>;

const PHONE_RE = /^\+?[0-9][0-9\s-]{6,18}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ------------------------------------------------------------------ */
/* Context: any button can open a form; focus returns to it on close.  */
/* ------------------------------------------------------------------ */

const FormContext = createContext<((type: FormType) => void) | null>(null);

export function useOpenForm() {
  const open = useContext(FormContext);
  if (!open) throw new Error('useOpenForm must be used inside FormDialogProvider');
  return open;
}

export function FormDialogProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<FormType | null>(null);
  const [lastType, setLastType] = useState<FormType>('new_member');
  const [session, setSession] = useState(0);

  const open = useCallback((type: FormType) => {
    setLastType(type);
    setSession((s) => s + 1); // fresh form state each time it opens
    setActive(type);
  }, []);
  const close = useCallback(() => setActive(null), []);

  return (
    <FormContext.Provider value={open}>
      {children}
      <Dialog open={active !== null} onClose={close} labelledBy="form-dialog-title" describedBy="form-dialog-intro">
        <FormBody key={session} type={active ?? lastType} />
      </Dialog>
    </FormContext.Provider>
  );
}

/* ------------------------------------------------------------------ */

type Status = 'idle' | 'submitting' | 'success' | 'error';

function FormBody({ type }: { type: FormType }) {
  const { t } = useTranslation();
  const uid = useId();
  const def = FORMS[type];
  const copy = def.i18n;
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  const validate = useCallback(
    (v: Values): Errors => {
      const e: Errors = {};
      const val = (n: FieldName) => (v[n] ?? '').trim();
      if (!val('name')) e.name = t('forms.errors.nameRequired');
      if (!val('phone')) e.phone = t('forms.errors.phoneRequired');
      else if (!PHONE_RE.test(val('phone'))) e.phone = t('forms.errors.phoneInvalid');
      if (val('email') && !EMAIL_RE.test(val('email'))) e.email = t('forms.errors.emailInvalid');
      if (type === 'prayer_request' && !val('request')) e.request = t('forms.errors.requestRequired');
      return e;
    },
    [t, type],
  );

  const update = (name: FieldName, value: string) => {
    const next = { ...values, [name]: value };
    setValues(next);
    if (attempted) setErrors(validate(next));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (status === 'submitting') return;
    setAttempted(true);
    const found = validate(values);
    setErrors(found);
    const firstInvalid = def.fields.find((f) => found[f.name]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid.name}"]`)?.focus();
      return;
    }
    setStatus('submitting');
    try {
      const payload: Record<string, string> = {};
      for (const f of def.fields) payload[f.name] = (values[f.name] ?? '').trim();
      await submitForm(type, payload);
      setStatus('success');
      requestAnimationFrame(() => successRef.current?.focus());
    } catch {
      setStatus('error');
    }
  };

  const closeButton = (
    <form method="dialog" className="absolute right-3 top-3">
      <button type="submit" className="icon-button" aria-label={t('forms.close')}>
        <Icon name="close-circle-linear" className="h-6 w-6" />
      </button>
    </form>
  );

  if (status === 'success') {
    return (
      <div className="relative px-6 pb-8 pt-14 text-center sm:px-10">
        {closeButton}
        <Icon name="check-circle-linear" className="mx-auto h-10 w-10 text-ink" />
        <h2 id="form-dialog-title" ref={successRef} tabIndex={-1} className="mt-4 font-label text-2xl leading-tight outline-none">
          {t(`forms.${copy}.success`)}
        </h2>
        <p id="form-dialog-intro" className="mx-auto mt-3 max-w-sm text-stone-600">
          {t('forms.staffNote')}
        </p>
        <form method="dialog" className="mt-8">
          <button type="submit" className="btn btn--solid">
            {t('forms.close')}
          </button>
        </form>
      </div>
    );
  }

  const busy = status === 'submitting';
  const hasErrors = attempted && Object.keys(errors).length > 0;

  return (
    <div className="relative px-6 pb-8 pt-10 sm:px-10">
      {closeButton}
      <h2 id="form-dialog-title" className="pr-10 font-label text-[1.75rem] leading-[1.05]">
        {t(`forms.${copy}.title`)}
      </h2>
      <p id="form-dialog-intro" className="mt-3 text-stone-600">
        {t(`forms.${copy}.intro`)}
      </p>

      <form ref={formRef} noValidate onSubmit={onSubmit} aria-busy={busy} className="mt-6 space-y-5">
        {hasErrors && (
          <p className="form-alert" role="alert">
            <Icon name="danger-circle-linear" className="h-5 w-5 shrink-0" />
            {t('forms.errorSummary')}
          </p>
        )}

        {def.fields.map((field) => {
          const id = `${uid}-${field.name}`;
          const errorId = `${id}-error`;
          const hintId = `${id}-hint`;
          const error = errors[field.name];
          const describedBy = [field.hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
          const common = {
            id,
            name: field.name,
            value: values[field.name] ?? '',
            required: field.required,
            'aria-invalid': error ? true : undefined,
            'aria-describedby': describedBy,
            className: 'field-control',
          } as const;

          return (
            <div key={field.name}>
              <label htmlFor={id} className="field-label">
                {t(`forms.fields.${field.name}`)}
                <span className="field-flag">{field.required ? t('forms.required') : t('forms.optional')}</span>
              </label>
              {field.kind === 'textarea' ? (
                <textarea {...common} readOnly={busy} rows={4} onChange={(e) => update(field.name, e.target.value)} />
              ) : field.kind === 'select' ? (
                <select {...common} onChange={(e) => update(field.name, e.target.value)}>
                  {VOICE_PARTS.map((part) => (
                    <option key={part} value={part === 'none' ? '' : part}>
                      {t(`forms.voiceParts.${part}`)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  {...common}
                  readOnly={busy}
                  type={field.kind}
                  autoComplete={field.autoComplete}
                  inputMode={field.kind === 'tel' ? 'tel' : field.kind === 'email' ? 'email' : undefined}
                  onChange={(e) => update(field.name, e.target.value)}
                />
              )}
              {field.hint && (
                <p id={hintId} className="field-hint">
                  {t(`forms.hints.${field.hint}`)}
                </p>
              )}
              {error && (
                <p id={errorId} className="field-error">
                  {error}
                </p>
              )}
            </div>
          );
        })}

        {status === 'error' && (
          <p className="form-alert" role="alert">
            <Icon name="danger-circle-linear" className="h-5 w-5 shrink-0" />
            {t('forms.errorSubmit')}
          </p>
        )}

        <p className="flex gap-2 text-sm text-stone-600">
          <Icon name="phone-linear" className="mt-0.5 h-4 w-4 shrink-0" />
          {t('forms.staffNote')}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="submit" className="btn btn--solid" aria-disabled={busy || undefined}>
            {busy ? (
              <>
                <span className="spinner" aria-hidden="true" />
                {t('forms.submitting')}
              </>
            ) : status === 'error' ? (
              <>
                <Icon name="refresh-linear" className="h-4 w-4" />
                {t('forms.retry')}
              </>
            ) : (
              t('forms.submit')
            )}
          </button>
        </div>
      </form>
      {/* Polite live region so screen readers hear the sending state. */}
      <p className="sr-only" aria-live="polite">
        {busy ? t('forms.submitting') : ''}
      </p>
    </div>
  );
}
