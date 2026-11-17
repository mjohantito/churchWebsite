import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConflict } from '../../data/admin/hooks';
import { isIsoDate, jakartaToday } from '../../lib/dates';
import { useContentEditor } from '../useContentEditor';
import { EditorFrame } from '../EditorFrame';
import { FileField } from '../FileField';
import { Bilingual, Card, MarkdownField, TextField } from '../ui';
import { clean, date, maxLen, orNull, required, requiredMax } from '../validate';

type Form = { entry_date: string; title_id: string; title_en: string; scripture_ref: string; body_id: string; body_en: string; audio_path: string | null };
const BASE = '/admin/daily-bread';

export default function DailyBreadEdit() {
  const { t } = useTranslation();
  const { id = 'new' } = useParams();
  const [params] = useSearchParams();
  const preset = params.get('date');
  const ed = useContentEditor({
    table: 'daily_bread',
    id: id === 'new' ? null : id,
    basePath: BASE,
    empty: (): Form => ({ entry_date: isIsoDate(preset) ? preset : jakartaToday(), title_id: '', title_en: '', scripture_ref: '', body_id: '', body_en: '', audio_path: null }),
    fromRow: (r) => ({ entry_date: r.entry_date, title_id: r.title_id, title_en: r.title_en ?? '', scripture_ref: r.scripture_ref ?? '', body_id: r.body_id, body_en: r.body_en ?? '', audio_path: r.audio_path }),
    toInput: (f, status) => ({ entry_date: f.entry_date, title_id: f.title_id.trim(), title_en: orNull(f.title_en), scripture_ref: orNull(f.scripture_ref), body_id: f.body_id.trim(), body_en: orNull(f.body_en), audio_path: f.audio_path, status }),
    validate: (f) => clean({
      entry_date: date(f.entry_date),
      title_id: requiredMax(f.title_id, 200),
      title_en: maxLen(f.title_en, 200),
      scripture_ref: maxLen(f.scripture_ref, 120),
      body_id: required(f.body_id) ?? maxLen(f.body_id, 20000),
      body_en: maxLen(f.body_en, 20000),
    }),
  });
  const { form, set, errors } = ed;
  const conflict = useConflict('daily_bread', isIsoDate(form.entry_date) ? { entry_date: form.entry_date } : null, id === 'new' ? null : id);

  return (
    <EditorFrame editor={ed} title={ed.isNew ? t('admin.dailyBread.new') : t('admin.dailyBread.edit')} back={{ to: BASE, label: t('admin.nav.dailyBread') }}>
      <Card>
        <TextField label={t('admin.dailyBread.date')} type="date" required value={form.entry_date} error={errors.entry_date}
          onChange={(v) => set('entry_date', v)} className="max-w-xs" />
        {conflict.data && (
          <p className="notice mt-3" role="status">
            {t('admin.dailyBread.exists')}{' '}
            <Link to={`${BASE}/${conflict.data}`} className="prose-link">{t('admin.common.openExisting')}</Link>
          </p>
        )}
      </Card>
      <Card>
        <Bilingual render={(l) => (
          <TextField label={t('admin.dailyBread.titleField')} required={l === 'id'} lang={l}
            value={l === 'id' ? form.title_id : form.title_en} error={l === 'id' ? errors.title_id : errors.title_en}
            onChange={(v) => set(l === 'id' ? 'title_id' : 'title_en', v)} />
        )} />
        <TextField label={t('admin.dailyBread.scripture')} hint={t('admin.dailyBread.scriptureHint')} value={form.scripture_ref}
          error={errors.scripture_ref} onChange={(v) => set('scripture_ref', v)} className="mt-6 max-w-md" />
      </Card>
      <Card>
        <Bilingual render={(l) => (
          <MarkdownField label={t('admin.dailyBread.body')} required={l === 'id'} lang={l} rows={12}
            value={l === 'id' ? form.body_id : form.body_en} error={l === 'id' ? errors.body_id : errors.body_en}
            onChange={(v) => set(l === 'id' ? 'body_id' : 'body_en', v)} />
        )} />
      </Card>
      <Card>
        <FileField label={t('admin.dailyBread.audio')} hint={t('admin.dailyBread.audioHint')} bucket="daily-bread-audio" kind="audio"
          value={form.audio_path} onChange={(p) => set('audio_path', p)} onUploadingChange={ed.setUploading} />
      </Card>
    </EditorFrame>
  );
}
