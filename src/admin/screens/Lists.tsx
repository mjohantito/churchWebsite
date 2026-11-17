// The four content list screens, built on ContentList.
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAllGroups } from '../../data/admin/hooks';
import { useLocalized } from '../../lib/useLocalized';
import { ContentList } from './ContentList';
import { SelectField } from '../ui';

const useDate = () => {
  const { formatDate } = useLocalized();
  return formatDate;
};

export function DailyBreadList() {
  const { t } = useTranslation();
  const fmt = useDate();
  return (
    <ContentList table="daily_bread" title={t('admin.nav.dailyBread')} basePath="/admin/daily-bread" newLabel={t('admin.dailyBread.new')}
      describe={(r) => ({ meta: fmt(r.entry_date), primary: r.title_id, secondary: r.scripture_ref ?? undefined })} />
  );
}

export function SermonList() {
  const { t } = useTranslation();
  const fmt = useDate();
  return (
    <ContentList table="sermons" title={t('admin.nav.sermons')} basePath="/admin/sermons" newLabel={t('admin.sermons.new')}
      describe={(r) => ({ meta: fmt(r.preached_on), primary: r.title_id, secondary: r.preacher ?? undefined })} />
  );
}

export function WeeklyList() {
  const { t } = useTranslation();
  const fmt = useDate();
  return (
    <ContentList table="weekly_items" title={t('admin.nav.weekly')} basePath="/admin/weekly" newLabel={t('admin.weekly.new')}
      describe={(r) => ({ meta: fmt(r.service_date), primary: r.title_id, secondary: t(`admin.weekly.kinds.${r.kind}`) })} />
  );
}

export function AnnouncementList() {
  const { t } = useTranslation();
  const { lang } = useLocalized();
  const [params, setParams] = useSearchParams();
  const group = params.get('group') ?? '';
  const groups = useAllGroups();
  const byId = new Map((groups.data ?? []).map((g) => [g.id, g.name]));
  const fmt = (iso: string | null) =>
    iso ? new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(iso)) : '—';
  return (
    <ContentList
      table="announcements"
      title={t('admin.nav.announcements')}
      basePath="/admin/announcements"
      newLabel={t('admin.announcements.new')}
      filter={group ? { group_id: group } : undefined}
      filters={
        <SelectField label={t('admin.announcements.group')} className="max-w-xs" value={group}
          options={[{ value: '', label: t('admin.announcements.allGroups') }, ...(groups.data ?? []).map((g) => ({ value: g.id, label: g.name }))]}
          onChange={(v) => setParams(v ? { group: v } : {})} />
      }
      describe={(r) => ({ meta: fmt(r.published_at), primary: r.title_id, secondary: byId.get(r.group_id) })}
    />
  );
}
