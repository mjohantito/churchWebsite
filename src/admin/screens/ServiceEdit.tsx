import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loading, LoadError } from '../../components/QueryState';
import { Icon } from '../../components/Icon';
import { useAuth } from '../../auth/AuthContext';
import { useAdminService, useDeleteService, useSaveService } from '../../data/admin/hooks';
import type { ServiceInput, ServiceWithTimes, TimeInput } from '../../data/admin/services';
import { dayName } from '../../data/churchInfo';
import { useLocalized } from '../../lib/useLocalized';
import { BilingualTabs, Button, Card, ConfirmDialog, PageHead, SelectField, Switch, TextArea, TextField } from '../ui';
import { useToast } from '../Toast';
import { useAdminError } from '../useAdminError';
import { useUnsavedGuard } from '../useUnsavedGuard';
import { maxLen, requiredMax } from '../validate';
import i18n from '../../i18n';

const BASE = '/admin/services';
const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

interface TimeRow { key: number; day: number; hh: string; mm: string; label_id: string; label_en: string }
interface Form {
  name_id: string; name_en: string; description_id: string; description_en: string;
  show_on_homepage: boolean; visible: boolean;
  weekly_kind: '' | 'sunday_material' | 'prayer_list';
  cta_type: 'none' | 'form_choir' | 'link'; cta_label_id: string; cta_label_en: string; cta_url: string;
  times: TimeRow[];
}

let nextKey = 1;
const emptyForm = (): Form => ({
  name_id: '', name_en: '', description_id: '', description_en: '', show_on_homepage: true, visible: true,
  weekly_kind: '', cta_type: 'none', cta_label_id: '', cta_label_en: '', cta_url: '',
  times: [{ key: nextKey++, day: 0, hh: '18', mm: '00', label_id: '', label_en: '' }],
});
const fromRow = (s: ServiceWithTimes): Form => ({
  name_id: s.name_id, name_en: s.name_en ?? '', description_id: s.description_id ?? '', description_en: s.description_en ?? '',
  show_on_homepage: s.show_on_homepage, visible: s.visible, weekly_kind: s.weekly_kind ?? '',
  cta_type: s.cta_type, cta_label_id: s.cta_label_id ?? '', cta_label_en: s.cta_label_en ?? '', cta_url: s.cta_url ?? '',
  times: s.church_service_times.map((x) => ({
    key: nextKey++, day: x.day_of_week, hh: x.start_time.slice(0, 2), mm: x.start_time.slice(3, 5), label_id: x.label_id ?? '', label_en: x.label_en ?? '',
  })),
});
const sortTimes = (rows: TimeRow[]) => [...rows].sort((a, b) => a.day - b.day || `${a.hh}${a.mm}`.localeCompare(`${b.hh}${b.mm}`));
/** Comparable snapshot (ignores row keys and time order). */
const snapshot = (f: Form) => JSON.stringify({ ...f, times: sortTimes(f.times).map(({ key: _k, ...r }) => r) });
const msg = (key: string, opts?: Record<string, unknown>) => String(i18n.t(key as 'admin.validation.required', opts as never));

type Errors = Partial<Record<'name_id' | 'name_en' | 'description_id' | 'description_en' | 'cta_label_id' | 'cta_label_en' | 'cta_url' | 'times', string>> & { rows?: Record<number, string> };

function validate(f: Form, fixed: boolean): Errors {
  const e: Errors = {};
  if (!fixed) {
    e.name_id = requiredMax(f.name_id, 120);
    e.name_en = maxLen(f.name_en, 120);
    e.description_id = maxLen(f.description_id, 2000);
    e.description_en = maxLen(f.description_en, 2000);
  }
  if (f.cta_type !== 'none') {
    e.cta_label_id = requiredMax(f.cta_label_id, 80);
    e.cta_label_en = maxLen(f.cta_label_en, 80);
  }
  if (f.cta_type === 'link') {
    e.cta_url = !f.cta_url.trim() ? msg('admin.validation.required')
      : !/^(https?:\/\/\S+|\/\S*|mailto:\S+|tel:[+\d\s()-]+)$/i.test(f.cta_url.trim()) ? msg('admin.services.urlInvalid')
      : maxLen(f.cta_url, 500);
  }
  if (fixed && f.times.length === 0) e.times = msg('admin.services.sundayNeedsTime');
  const seen = new Map<string, number>();
  const rows: Record<number, string> = {};
  for (const r of f.times) {
    const k = `${r.day}-${r.hh}:${r.mm}`;
    if (seen.has(k)) rows[r.key] = msg('admin.services.duplicateTime');
    seen.set(k, r.key);
    if (r.label_id.length > 60 || r.label_en.length > 60) rows[r.key] = msg('admin.validation.tooLong', { max: 60 });
  }
  if (Object.keys(rows).length) e.rows = rows;
  for (const k of Object.keys(e) as (keyof Errors)[]) if (e[k] === undefined) delete e[k];
  return e;
}

export default function ServiceEdit() {
  const { t } = useTranslation();
  const { id = 'new' } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { staff } = useAuth();
  const { lang } = useLocalized();
  const toast = useToast();
  const onError = useAdminError();
  const q = useAdminService(isNew ? null : id);
  const save = useSaveService();
  const del = useDeleteService();
  const [form, setForm] = useState<Form>(emptyForm);
  const [baseline, setBaseline] = useState(() => snapshot(form));
  const [errors, setErrors] = useState<Errors>({});
  const [confirm, setConfirm] = useState(false);
  const loaded = useRef<string | null>(null);
  const fixed = Boolean(q.data?.is_fixed);

  useEffect(() => {
    if (q.data && loaded.current !== id) {
      const f = fromRow(q.data);
      setForm(f);
      setBaseline(snapshot(f));
      loaded.current = id;
    }
  }, [q.data, id]);

  const dirty = snapshot(form) !== baseline;
  const guard = useUnsavedGuard(dirty);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setTime = (key: number, patch: Partial<TimeRow>) => setForm((f) => ({ ...f, times: f.times.map((r) => (r.key === key ? { ...r, ...patch } : r)) }));
  const days = useMemo(() => Array.from({ length: 7 }, (_, d) => ({ value: String(d), label: dayName(d, lang) })), [lang]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(form, fixed);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error(t('admin.errors.fixFields'));
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    const sorted = sortTimes(form.times);
    const service: ServiceInput = {
      // The Sunday name and description cannot change (the database enforces it too).
      name_id: fixed ? q.data!.name_id : form.name_id.trim(),
      name_en: fixed ? q.data!.name_en : form.name_en.trim() || null,
      description_id: fixed ? q.data!.description_id : form.description_id.trim() || null,
      description_en: fixed ? q.data!.description_en : form.description_en.trim() || null,
      show_on_homepage: form.show_on_homepage,
      visible: form.visible,
      weekly_kind: form.weekly_kind || null,
      cta_type: form.cta_type,
      cta_label_id: form.cta_type === 'none' ? null : form.cta_label_id.trim(),
      cta_label_en: form.cta_type === 'none' ? null : form.cta_label_en.trim() || null,
      cta_url: form.cta_type === 'link' ? form.cta_url.trim() : null,
    };
    const times: TimeInput[] = sorted.map((r) => ({ day_of_week: r.day, start_time: `${r.hh}:${r.mm}`, label_id: r.label_id.trim() || null, label_en: r.label_en.trim() || null }));
    try {
      const savedId = await save.mutateAsync({ id: isNew ? null : id, service, times });
      const next = { ...form, times: sorted };
      setForm(next);
      setBaseline(snapshot(next));
      toast.success(t('admin.toast.saved'));
      if (isNew) {
        guard.allowNavigation();
        navigate(`${BASE}/${savedId}`, { replace: true });
      }
    } catch (err) {
      onError(err);
    }
  };

  const remove = async () => {
    setConfirm(false);
    try {
      await del.mutateAsync(id);
      toast.success(t('admin.toast.deleted'));
      guard.allowNavigation();
      navigate(BASE, { replace: true });
    } catch (err) {
      onError(err);
    }
  };

  const back = { to: BASE, label: t('admin.nav.services') };
  if (!isNew && q.isPending) return <Loading lines={6} className="max-w-xl" />;
  if (!isNew && (q.isError || !q.data)) return (<><PageHead title={t('admin.services.edit')} back={back} /><LoadError onRetry={() => void q.refetch()} /></>);

  const busy = save.isPending || del.isPending;
  const nameErrorIn = errors.name_id || errors.description_id ? 'id' : errors.name_en || errors.description_en ? 'en' : null;
  const ctaErrorIn = errors.cta_label_id ? 'id' : errors.cta_label_en ? 'en' : null;

  return (
    <>
      <PageHead title={isNew ? t('admin.services.new') : t('admin.services.edit')} back={back}>
        {dirty && <span className="badge badge--warn">{t('admin.common.unsaved')}</span>}
      </PageHead>

      <form onSubmit={onSubmit} noValidate className="space-y-8 pb-28">
        {fixed && (
          <p className="notice flex items-start gap-2" role="note">
            <Icon name="lock-keyhole-linear" className="mt-0.5 h-5 w-5 shrink-0" />
            {t('admin.services.fixedNote')}
          </p>
        )}

        <Card>
          <h2 className="admin-h2">{t('admin.services.nameSection')}</h2>
          <fieldset disabled={fixed} className="mt-2">
            <BilingualTabs errorIn={nameErrorIn} render={(l) => (
              <>
                <TextField label={t('admin.services.name')} required={l === 'id'} lang={l} maxLength={120}
                  value={l === 'id' ? form.name_id : form.name_en} error={l === 'id' ? errors.name_id : errors.name_en}
                  onChange={(v) => set(l === 'id' ? 'name_id' : 'name_en', v)} />
                <TextArea label={t('admin.services.description')} lang={l} rows={4} maxLength={2000}
                  value={l === 'id' ? form.description_id : form.description_en} error={l === 'id' ? errors.description_id : errors.description_en}
                  onChange={(v) => set(l === 'id' ? 'description_id' : 'description_en', v)} />
              </>
            )} />
          </fieldset>
        </Card>

        <Card>
          <fieldset>
            <legend className="admin-h2">{t('admin.services.times')}</legend>
            <p className="field-hint">{t('admin.services.timesHint')}</p>
            {errors.times && <p className="field-error" role="alert">{errors.times}</p>}
            <ul className="mt-4 space-y-3">
              {form.times.map((r, i) => {
                const rowError = errors.rows?.[r.key];
                const n = i + 1;
                return (
                  <li key={r.key} className="time-row" aria-label={t('admin.services.timeN', { n })}>
                    <SelectField label={t('admin.services.day')} value={String(r.day)} options={days}
                      onChange={(v) => setTime(r.key, { day: Number(v) })} />
                    <div>
                      <p className="field-label" id={`t-${r.key}`}>{t('admin.services.time')}<span className="field-flag">WIB</span></p>
                      <div className="time-pick" role="group" aria-labelledby={`t-${r.key}`}>
                        <select className="field-control" aria-label={t('admin.services.hour')} value={r.hh} aria-invalid={rowError ? true : undefined}
                          onChange={(e) => setTime(r.key, { hh: e.target.value })}>
                          {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span aria-hidden="true">:</span>
                        <select className="field-control" aria-label={t('admin.services.minute')} value={r.mm}
                          onChange={(e) => setTime(r.key, { mm: e.target.value })}>
                          {[...new Set([...MINUTES, r.mm])].sort().map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                    <TextField label={t('admin.services.labelId')} value={r.label_id} maxLength={60} placeholder={t('admin.services.labelPlaceholder')}
                      onChange={(v) => setTime(r.key, { label_id: v })} />
                    <TextField label={t('admin.services.labelEn')} value={r.label_en} maxLength={60}
                      onChange={(v) => setTime(r.key, { label_en: v })} />
                    <Button variant="ghost" icon="trash-bin-minimalistic-linear" aria-label={t('admin.services.removeTime', { n })}
                      disabled={fixed && form.times.length <= 1}
                      onClick={() => set('times', form.times.filter((x) => x.key !== r.key))} />
                    {rowError && <p className="field-error md:col-span-full" role="alert">{rowError}</p>}
                  </li>
                );
              })}
            </ul>
            <Button className="mt-4" icon="add-circle-linear"
              onClick={() => set('times', [...form.times, { key: nextKey++, day: form.times.at(-1)?.day ?? 0, hh: '18', mm: '00', label_id: '', label_en: '' }])}>
              {t('admin.services.addTime')}
            </Button>
          </fieldset>
        </Card>

        <Card>
          <div className="grid gap-6 sm:grid-cols-2">
            <SelectField label={t('admin.services.weekly')} hint={t('admin.services.weeklyHint')} value={form.weekly_kind}
              options={[
                { value: '', label: t('admin.services.weeklyNone') },
                { value: 'sunday_material', label: t('admin.weekly.kinds.sunday_material') },
                { value: 'prayer_list', label: t('admin.weekly.kinds.prayer_list') },
              ]}
              onChange={(v) => set('weekly_kind', v as Form['weekly_kind'])} />
            <SelectField label={t('admin.services.ctaType')} value={form.cta_type}
              options={[
                { value: 'none', label: t('admin.services.ctaNone') },
                { value: 'form_choir', label: t('admin.services.ctaChoir') },
                { value: 'link', label: t('admin.services.ctaLink') },
              ]}
              onChange={(v) => set('cta_type', v as Form['cta_type'])} />
          </div>
          {form.cta_type !== 'none' && (
            <div className="mt-6 space-y-5">
              <BilingualTabs errorIn={ctaErrorIn} render={(l) => (
                <TextField label={t('admin.services.ctaLabel')} required={l === 'id'} lang={l} maxLength={80}
                  value={l === 'id' ? form.cta_label_id : form.cta_label_en} error={l === 'id' ? errors.cta_label_id : errors.cta_label_en}
                  onChange={(v) => set(l === 'id' ? 'cta_label_id' : 'cta_label_en', v)} />
              )} />
              {form.cta_type === 'link' && (
                <TextField label={t('admin.services.ctaUrl')} required hint={t('admin.services.ctaUrlHint')} type="url" inputMode="url"
                  value={form.cta_url} error={errors.cta_url} maxLength={500} onChange={(v) => set('cta_url', v)} />
              )}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <Switch checked={form.visible} label={t('admin.services.visible')} onChange={(v) => set('visible', v)} />
            <Switch checked={form.show_on_homepage} label={t('admin.services.onHomepage')} onChange={(v) => set('show_on_homepage', v)} />
          </div>
          <p className="field-hint">{t('admin.services.visibilityHint')}</p>
        </Card>

        <div className="editor-actions" role="group" aria-label={t('admin.common.actions')}>
          <Button type="submit" variant="primary" busy={save.isPending} disabled={busy}>{t('admin.common.save')}</Button>
          {staff?.role === 'admin' && !isNew && !fixed && (
            <Button variant="danger" className="sm:ml-auto" icon="trash-bin-minimalistic-linear" disabled={busy} onClick={() => setConfirm(true)}>
              {t('admin.common.delete')}
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog open={confirm} title={t('admin.services.deleteTitle')} body={t('admin.services.deleteBody')}
        confirmLabel={t('admin.common.delete')} cancelLabel={t('admin.common.cancel')} danger busy={del.isPending}
        onConfirm={() => void remove()} onCancel={() => setConfirm(false)} />
      {guard.dialog}
    </>
  );
}
