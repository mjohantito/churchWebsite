import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAllGroups } from '../../data/admin/hooks';
import { useContentEditor } from '../useContentEditor';
import { EditorFrame } from '../EditorFrame';
import { FileField } from '../FileField';
import { Bilingual, Card, MarkdownField, SelectField, TextField } from '../ui';
import { useWeekRange } from '../../components/WeekNav';
import { isIsoDate } from '../../lib/dates';
import { addWeeks, currentWeekStart, getWeekStart, isWeekStart } from '../../lib/week';
import { clean, maxLen, required, requiredMax } from '../validate';
import { orNull } from '../validate';
import i18n from '../../i18n';

type Form = { group_id: string; title_id: string; title_en: string; body_id: string; body_en: string; image_path: string | null; week_start: string };
const BASE = '/admin/announcements';

export default function AnnouncementEdit() {
  const { t } = useTranslation();
  const { id = 'new' } = useParams();
  const [params] = useSearchParams();
  const groups = useAllGroups();
  const thisWeek = currentWeekStart();
  const startWeek = isIsoDate(params.get('week')) ? getWeekStart(params.get('week')!) : thisWeek;
  const ed = useContentEditor({
    table: 'announcements',
    id: id === 'new' ? null : id,
    basePath: BASE,
    empty: (): Form => ({ group_id: params.get('group') ?? '', title_id: '', title_en: '', body_id: '', body_en: '', image_path: null, week_start: startWeek }),
    fromRow: (r) => ({ group_id: r.group_id, title_id: r.title_id, title_en: r.title_en ?? '', body_id: r.body_id, body_en: r.body_en ?? '', image_path: r.image_path, week_start: r.week_start }),
    toInput: (f, status) => ({ group_id: f.group_id, title_id: f.title_id.trim(), title_en: orNull(f.title_en), body_id: f.body_id.trim(), body_en: orNull(f.body_en), image_path: f.image_path, week_start: f.week_start, status }),
    validate: (f) => clean({
      group_id: required(f.group_id),
      title_id: requiredMax(f.title_id, 200),
      title_en: maxLen(f.title_en, 200),
      body_id: required(f.body_id) ?? maxLen(f.body_id, 10000),
      body_en: maxLen(f.body_en, 10000),
      week_start: isWeekStart(f.week_start) ? undefined : String(i18n.t('admin.validation.invalidDate')),
    }),
  });
  const { form, set, errors } = ed;
  const options = [
    { value: '', label: t('admin.announcements.pickGroup') },
    ...(groups.data ?? []).map((g) => ({ value: g.id, label: g.active ? g.name : `${g.name} ${t('admin.announcements.inactiveGroup')}` })),
  ];

  return (
    <EditorFrame editor={ed} title={ed.isNew ? t('admin.announcements.new') : t('admin.announcements.edit')} back={{ to: form.week_start === thisWeek ? BASE : `${BASE}?week=${form.week_start}`, label: t('admin.nav.announcements') }}>
      <Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <SelectField label={t('admin.announcements.group')} required value={form.group_id} options={options} error={errors.group_id} onChange={(v) => set('group_id', v)} />
          <WeekPicker value={form.week_start} thisWeek={thisWeek} error={errors.week_start} onChange={(v) => set('week_start', v)} />
        </div>
      </Card>
      <Card>
        <Bilingual render={(l) => (
          <TextField label={t('admin.announcements.titleField')} required={l === 'id'} lang={l}
            value={l === 'id' ? form.title_id : form.title_en} error={l === 'id' ? errors.title_id : errors.title_en}
            onChange={(v) => set(l === 'id' ? 'title_id' : 'title_en', v)} />
        )} />
      </Card>
      <Card>
        <Bilingual render={(l) => (
          <MarkdownField label={t('admin.announcements.body')} required={l === 'id'} lang={l} rows={10}
            value={l === 'id' ? form.body_id : form.body_en} error={l === 'id' ? errors.body_id : errors.body_en}
            onChange={(v) => set(l === 'id' ? 'body_id' : 'body_en', v)} />
        )} />
      </Card>
      <Card>
        <FileField label={t('admin.announcements.image')} bucket="announcement-images" kind="image"
          value={form.image_path} onChange={(p) => set('image_path', p)} onUploadingChange={ed.setUploading} />
      </Card>
    </EditorFrame>
  );
}

/**
 * "Minggu ini" / "Minggu depan" shortcuts, or any date: always stored as the
 * Sunday on or before it (src/lib/week.ts). Shows the resulting Sunday–Saturday range.
 */
function WeekPicker({ value, thisWeek, error, onChange }: { value: string; thisWeek: string; error?: string; onChange: (weekStart: string) => void }) {
  const { t } = useTranslation();
  const range = useWeekRange();
  const nextWeek = addWeeks(thisWeek, 1);
  const chip = (weekStart: string, label: string) => (
    <button type="button" className={`choice-chip ${value === weekStart ? 'is-on' : ''}`} aria-pressed={value === weekStart} onClick={() => onChange(weekStart)}>
      {label}
    </button>
  );
  return (
    <fieldset className="min-w-0">
      <legend className="field-label">
        {t('admin.announcements.week')}
        <span className="field-flag">{t('admin.common.required')}</span>
      </legend>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        {chip(thisWeek, t('admin.announcements.thisWeek'))}
        {chip(nextWeek, t('admin.announcements.nextWeekShort'))}
        <TextField label={t('admin.announcements.pickDate')} type="date" value={value} error={error} className="w-full sm:w-auto"
          onChange={(v) => isIsoDate(v) && onChange(getWeekStart(v))} />
      </div>
      <p className="mt-2 text-sm text-stone-700" aria-live="polite">
        {isIsoDate(value) ? t('admin.announcements.weekRange', { range: range(value) }) : null}
      </p>
    </fieldset>
  );
}
