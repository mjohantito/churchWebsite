import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConflict } from '../../data/admin/hooks';
import { addDays, isIsoDate, jakartaToday } from '../../lib/dates';
import { useContentEditor } from '../useContentEditor';
import { EditorFrame } from '../EditorFrame';
import { FileField } from '../FileField';
import { Bilingual, Card, SelectField, TextArea, TextField } from '../ui';
import { clean, date, maxLen, orNull, requiredMax } from '../validate';

type Kind = 'sunday_material' | 'prayer_list';
type Form = { kind: Kind; service_date: string; title_id: string; title_en: string; body_id: string; body_en: string; file_path: string | null };
const BASE = '/admin/weekly';

/** Next Sunday (sunday_material) or next Wednesday (prayer_list), today included. */
function nextServiceDate(kind: Kind) {
  const today = jakartaToday();
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay();
  return addDays(today, kind === 'sunday_material' ? (7 - dow) % 7 : (3 - dow + 7) % 7);
}

export default function WeeklyEdit() {
  const { t } = useTranslation();
  const { id = 'new' } = useParams();
  const [params] = useSearchParams();
  const presetKind: Kind = params.get('kind') === 'prayer_list' ? 'prayer_list' : 'sunday_material';
  const ed = useContentEditor({
    table: 'weekly_items',
    id: id === 'new' ? null : id,
    basePath: BASE,
    empty: (): Form => ({ kind: presetKind, service_date: nextServiceDate(presetKind), title_id: '', title_en: '', body_id: '', body_en: '', file_path: null }),
    fromRow: (r) => ({ kind: r.kind, service_date: r.service_date, title_id: r.title_id, title_en: r.title_en ?? '', body_id: r.body_id ?? '', body_en: r.body_en ?? '', file_path: r.file_path }),
    toInput: (f, status) => ({ kind: f.kind, service_date: f.service_date, title_id: f.title_id.trim(), title_en: orNull(f.title_en), body_id: orNull(f.body_id), body_en: orNull(f.body_en), file_path: f.file_path, status }),
    validate: (f) => clean({
      service_date: date(f.service_date),
      title_id: requiredMax(f.title_id, 200),
      title_en: maxLen(f.title_en, 200),
      body_id: maxLen(f.body_id, 10000),
      body_en: maxLen(f.body_en, 10000),
    }),
  });
  const { form, set, errors } = ed;
  const conflict = useConflict('weekly_items', isIsoDate(form.service_date) ? { kind: form.kind, service_date: form.service_date } : null, id === 'new' ? null : id);

  return (
    <EditorFrame editor={ed} title={ed.isNew ? t('admin.weekly.new') : t('admin.weekly.edit')} back={{ to: BASE, label: t('admin.nav.weekly') }}>
      <Card>
        <div className="grid gap-6 sm:grid-cols-2">
          <SelectField label={t('admin.weekly.kind')} required value={form.kind}
            options={(['sunday_material', 'prayer_list'] as const).map((k) => ({ value: k, label: t(`admin.weekly.kinds.${k}`) }))}
            onChange={(v) => {
              set('kind', v as Kind);
              if (ed.isNew) set('service_date', nextServiceDate(v as Kind));
            }} />
          <TextField label={t('admin.weekly.date')} type="date" required value={form.service_date} error={errors.service_date} onChange={(v) => set('service_date', v)} />
        </div>
        {conflict.data && (
          <p className="notice mt-3" role="status">
            {t('admin.weekly.exists')}{' '}
            <Link to={`${BASE}/${conflict.data}`} className="prose-link">{t('admin.common.openExisting')}</Link>
          </p>
        )}
      </Card>
      <Card>
        <Bilingual render={(l) => (
          <TextField label={t('admin.weekly.titleField')} required={l === 'id'} lang={l}
            value={l === 'id' ? form.title_id : form.title_en} error={l === 'id' ? errors.title_id : errors.title_en}
            onChange={(v) => set(l === 'id' ? 'title_id' : 'title_en', v)} />
        )} />
        <div className="mt-6">
          <Bilingual render={(l) => (
            <TextArea label={t('admin.weekly.body')} hint={t('admin.weekly.bodyHint')} lang={l} rows={6}
              value={l === 'id' ? form.body_id : form.body_en} error={l === 'id' ? errors.body_id : errors.body_en}
              onChange={(v) => set(l === 'id' ? 'body_id' : 'body_en', v)} />
          )} />
        </div>
      </Card>
      <Card>
        <FileField label={t('admin.weekly.file')} bucket="sermon-slides" kind="document"
          value={form.file_path} onChange={(p) => set('file_path', p)} onUploadingChange={ed.setUploading} />
      </Card>
    </EditorFrame>
  );
}
