import { useTranslation } from 'react-i18next';
import { Loading, LoadError } from '../../components/QueryState';
import { useStaffList } from '../../data/admin/hooks';
import { useLocalized } from '../../lib/useLocalized';
import { Card, PageHead } from '../ui';

/** Admin: read-only list. Accounts are created in the Supabase dashboard. */
export default function Staff() {
  const { t } = useTranslation();
  const { lang } = useLocalized();
  const staff = useStaffList();
  const fmt = (iso: string) => new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
  return (
    <>
      <PageHead title={t('admin.nav.staff')}>{t('admin.staff.note')}</PageHead>
      <Card>
        {staff.isPending ? <Loading lines={3} /> : staff.isError ? <LoadError onRetry={() => void staff.refetch()} /> : (
          <div className="overflow-x-auto">
            <table className="admin-grid admin-grid--plain">
              <thead>
                <tr>
                  <th scope="col">{t('admin.staff.name')}</th>
                  <th scope="col">{t('admin.staff.role')}</th>
                  <th scope="col">{t('admin.staff.since')}</th>
                </tr>
              </thead>
              <tbody>
                {staff.data.map((s) => (
                  <tr key={s.id}>
                    <th scope="row">{s.full_name}</th>
                    <td><span className={`badge ${s.role === 'admin' ? 'badge--ok' : 'badge--muted'}`}>{t(`admin.roles.${s.role}`)}</span></td>
                    <td>{fmt(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
