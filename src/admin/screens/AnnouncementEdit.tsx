import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAllGroups } from '../../data/admin/hooks';
import { useContentEditor } from '../useContentEditor';
import { EditorFrame } from '../EditorFrame';
import { FileField } from '../FileField';
import { Bilingual, Card, MarkdownField, SelectField, TextField } from '../ui';
import { clean, maxLen, required, requiredMax } from '../validate';
import { orNull } from '../validate';
import i18n from '../../i18n';

type Form = { group_id: string; title_id: string; title_en: string; body_id: string; body_en: string; image_path: string | null; published_local: string };
const BASE = '/admin/announcements';
const WIB_MS = 7 * 3600 * 1000; // Asia/Jakarta is UTC+7 all year

/** ISO timestamp -> "YYYY-MM-DDTHH:mm" in WIB (for <input type="datetime-local">). */
const toLocal = (iso: string | null) => new Date((iso ? Date.parse(iso) : Date.now()) + WIB_MS).toISOString().slice(0, 16);
/** "YYYY-MM-DDTHH:mm" in WIB -> ISO timestamp. */
const fromLocal = (v: string) => new Date(`${v}:00+07:00`).toISOString();

export default function AnnouncementEdit() {
  const { t } = useTranslation();
  const { id = 'new' } = useParams();
  const [params] = useSearchParams();
  const groups = useAllGroups();
  const ed = useContentEditor({
    table: 'announcements',
    id: id === 'new' ? null : id,
    basePath: BASE,
    empty: (): Form => ({ group_id: params.get('group') ?? '', title_id: '', title_en: '', body_id: '', body_en: '', image_path: null, published_local: toLocal(null) }),
    fromRow: (r) => ({ group_id: r.group_id, title_id: r.title_id, title_en: r.title_en ?? '', body_id: r.body_id, body_en: r.body_en ?? '', image_path: r.image_path, published_local: toLocal(r.published_at) }),
    toInput: (f, status) => ({ group_id: f.group_id, title_id: f.title_id.trim(), title_en: orNull(f.title_en), body_id: f.body_id.trim(), body_en: orNull(f.body_en), image_path: f.image_path, published_at: fromLocal(f.published_local), status }),
    validate: (f) => clean({
      group_id: required(f.group_id),
      title_id: requiredMax(f.title_id, 200),
      title_en: maxLen(f.title_en, 200),
      body_id: required(f.body_id) ?? maxLen(f.body_id, 10000),
      body_en: maxLen(f.body_en, 10000),
      published_local: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(f.published_local) ? undefined : String(i18n.t('admin.validation.invalidDate')),
    }),
  });
  const { form, set, errors } = ed;
  const options = [
    { value: '', label: t('admin.announcements.pickGroup') },
    ...(groups.data ?? []).map((g) => ({ value: g.id, label: g.active ? g.name : `${g.name} ${t('admin.announcements.inactiveGroup')}` })),
  ];

  return (
    <EditorFrame editor={ed} title={ed.isNew ? t('admin.announcements.new') : t('admin.announcements.edit')} back={{ to: BASE, label: t('admin.nav.announcements') }}>
      <Card>
        <div className="grid gap-6 sm:grid-cols-2">
          <SelectField label={t('admin.announcements.group')} required value={form.group_id} options={options} error={errors.group_id} onChange={(v) => set('group_id', v)} />
          <TextField label={t('admin.announcements.publishedAt')} hint={t('admin.announcements.publishedAtHint')} type="datetime-local" required
            value={form.published_local} error={errors.published_local} onChange={(v) => set('published_local', v)} />
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
