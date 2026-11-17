import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Empty, Loading, LoadError } from '../../components/QueryState';
import { Icon } from '../../components/Icon';
import { useConflict, useInboxSummary } from '../../data/admin/hooks';
import type { SubmissionType } from '../../data/admin/inbox';
import { jakartaToday } from '../../lib/dates';
import { useAuth } from '../../auth/AuthContext';
import { ButtonLink, Card, PageHead } from '../ui';
import { SubmissionItem } from './Inbox';

const TYPES: SubmissionType[] = ['new_member', 'prayer', 'choir', 'baptism', 'contact'];

export default function Dashboard() {
  const { t } = useTranslation();
  const { staff } = useAuth();
  const summary = useInboxSummary();
  const today = jakartaToday();
  const todayEntry = useConflict('daily_bread', { entry_date: today }, null);

  return (
    <>
      <PageHead title={t('admin.nav.dashboard')}>{staff && t('admin.dashboard.welcome', { name: staff.full_name })}</PageHead>

      <Card>
        <h2 className="admin-h2">{t('admin.dashboard.quick')}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink variant="primary" icon="book-2-linear"
            to={todayEntry.data ? `/admin/daily-bread/${todayEntry.data}` : `/admin/daily-bread/new?date=${today}`}>
            {todayEntry.data ? t('admin.dashboard.editDailyBread') : t('admin.dashboard.addDailyBread')}
          </ButtonLink>
          <ButtonLink icon="document-text-linear" to="/admin/announcements/new">{t('admin.dashboard.addAnnouncement')}</ButtonLink>
          <ButtonLink icon="calendar-linear" to="/admin/roster">{t('admin.dashboard.updateRoster')}</ButtonLink>
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="admin-h2">{t('admin.dashboard.newSubmissions')}</h2>
          <Link to="/admin/inbox?status=new" className="prose-link text-sm">{t('admin.dashboard.viewInbox')}</Link>
        </div>
        {summary.isPending ? (
          <Loading lines={2} className="mt-4" />
        ) : summary.isError ? (
          <LoadError onRetry={() => void summary.refetch()} className="mt-4" />
        ) : (
          <ul className="stat-grid mt-4">
            {TYPES.map((type) => {
              const n = summary.data.counts[type] ?? 0;
              return (
                <li key={type}>
                  <Link to={`/admin/inbox?status=new&type=${type}`} className={`stat ${n ? 'stat--hot' : ''}`}>
                    <span className="stat__n">{n}</span>
                    <span className="stat__label">{t(`admin.inbox.types.${type}`)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="admin-h2">{t('admin.dashboard.latest')}</h2>
        {summary.isPending ? (
          <Loading lines={3} className="mt-4" />
        ) : summary.data && summary.data.latest.length ? (
          <ul className="admin-list mt-4">
            {summary.data.latest.map((s) => (
              <li key={s.id}><SubmissionItem s={s} /></li>
            ))}
          </ul>
        ) : (
          <Empty className="mt-4">{t('admin.inbox.empty')}</Empty>
        )}
        <p className="mt-4">
          <Link to="/admin/inbox" className="text-link">
            {t('admin.dashboard.viewInbox')}
            <Icon name="arrow-right-linear" className="h-4 w-4" />
          </Link>
        </p>
      </Card>
    </>
  );
}
