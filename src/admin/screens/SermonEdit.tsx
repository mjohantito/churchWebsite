import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { jakartaToday } from '../../lib/dates';
import { parseYouTubeId } from '../../lib/youtube';
import { useContentEditor } from '../useContentEditor';
import { EditorFrame } from '../EditorFrame';
import { FileField } from '../FileField';
import { Bilingual, Card, MarkdownField, TextField } from '../ui';
import { clean, date, maxLen, orNull, requiredMax } from '../validate';
import i18n from '../../i18n';

type Form = { title_id: string; title_en: string; preacher: string; preached_on: string; scripture_ref: string; youtube: string; summary_id: string; summary_en: string; slides_path: string | null };
const BASE = '/admin/sermons';

export default function SermonEdit() {
  const { t } = useTranslation();
  const { id = 'new' } = useParams();
  const ed = useContentEditor({
    table: 'sermons',
    id: id === 'new' ? null : id,
    basePath: BASE,
    empty: (): Form => ({ title_id: '', title_en: '', preacher: '', preached_on: jakartaToday(), scripture_ref: '', youtube: '', summary_id: '', summary_en: '', slides_path: null }),
    fromRow: (r) => ({
      title_id: r.title_id, title_en: r.title_en ?? '', preacher: r.preacher ?? '', preached_on: r.preached_on, scripture_ref: r.scripture_ref ?? '',
      youtube: r.youtube_id ? `https://youtu.be/${r.youtube_id}` : '', summary_id: r.summary_id ?? '', summary_en: r.summary_en ?? '', slides_path: r.slides_path,
    }),
    toInput: (f, status) => ({
      title_id: f.title_id.trim(), title_en: orNull(f.title_en), preacher: orNull(f.preacher), preached_on: f.preached_on,
      scripture_ref: orNull(f.scripture_ref), youtube_id: parseYouTubeId(f.youtube), summary_id: orNull(f.summary_id),
      summary_en: orNull(f.summary_en), slides_path: f.slides_path, status,
    }),
    validate: (f) => clean({
      title_id: requiredMax(f.title_id, 200),
      title_en: maxLen(f.title_en, 200),
      preacher: maxLen(f.preacher, 120),
      preached_on: date(f.preached_on),
      scripture_ref: maxLen(f.scripture_ref, 120),
      youtube: f.youtube.trim() && !parseYouTubeId(f.youtube) ? String(i18n.t('admin.validation.youtube')) : undefined,
      summary_id: maxLen(f.summary_id, 10000),
      summary_en: maxLen(f.summary_en, 10000),
    }),
  });
  const { form, set, errors } = ed;
  const videoId = parseYouTubeId(form.youtube);

  return (
    <EditorFrame editor={ed} title={ed.isNew ? t('admin.sermons.new') : t('admin.sermons.edit')} back={{ to: BASE, label: t('admin.nav.sermons') }}>
      <Card>
        <Bilingual render={(l) => (
          <TextField label={t('admin.sermons.titleField')} required={l === 'id'} lang={l}
            value={l === 'id' ? form.title_id : form.title_en} error={l === 'id' ? errors.title_id : errors.title_en}
            onChange={(v) => set(l === 'id' ? 'title_id' : 'title_en', v)} />
        )} />
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <TextField label={t('admin.sermons.date')} type="date" required value={form.preached_on} error={errors.preached_on} onChange={(v) => set('preached_on', v)} />
          <TextField label={t('admin.sermons.preacher')} value={form.preacher} error={errors.preacher} onChange={(v) => set('preacher', v)} />
          <TextField label={t('admin.sermons.scripture')} value={form.scripture_ref} error={errors.scripture_ref} onChange={(v) => set('scripture_ref', v)} />
        </div>
      </Card>
      <Card>
        <TextField label={t('admin.sermons.youtube')} hint={t('admin.sermons.youtubeHint')} type="url" inputMode="url"
          value={form.youtube} error={errors.youtube} onChange={(v) => set('youtube', v)} />
        {videoId && (
          <div className="mt-4 max-w-xl overflow-hidden rounded-xl bg-ink" style={{ aspectRatio: '16 / 9' }}>
            <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
              title={t('admin.sermons.preview')} loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin" />
          </div>
        )}
      </Card>
      <Card>
        <Bilingual render={(l) => (
          <MarkdownField label={t('admin.sermons.summary')} lang={l} rows={8}
            value={l === 'id' ? form.summary_id : form.summary_en} error={l === 'id' ? errors.summary_id : errors.summary_en}
            onChange={(v) => set(l === 'id' ? 'summary_id' : 'summary_en', v)} />
        )} />
      </Card>
      <Card>
        <FileField label={t('admin.sermons.slides')} bucket="sermon-slides" kind="document"
          value={form.slides_path} onChange={(p) => set('slides_path', p)} onUploadingChange={ed.setUploading} />
      </Card>
    </EditorFrame>
  );
}
