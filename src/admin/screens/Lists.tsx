// Content list screens built on ContentList (announcements have their own week view: Announcements.tsx).
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../../lib/useLocalized';
import { ContentList } from './ContentList';

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

