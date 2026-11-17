// Staff admin area (/admin/*). Loaded as its own chunk; never part of the public bundle.
import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RequireStaff } from '../auth/RequireStaff';
import { useAuth } from '../auth/AuthContext';
import { Loading } from '../components/QueryState';
import { useNoIndex } from '../lib/useNoIndex';
import { AdminShell } from './AdminShell';
import { ToastProvider } from './Toast';
import { PageHead } from './ui';
import i18n from '../i18n';
import adminId from '../i18n/admin-id';
import adminEn from '../i18n/admin-en';

// Admin UI text ships with this chunk, not with the public site.
i18n.addResourceBundle('id', 'translation', { admin: adminId }, true, true);
i18n.addResourceBundle('en', 'translation', { admin: adminEn }, true, true);
import Dashboard from './screens/Dashboard';
import Inbox from './screens/Inbox';
import './admin.css';
import { AnnouncementList, DailyBreadList, SermonList, WeeklyList } from './screens/Lists';

const InboxDetail = lazy(() => import('./screens/InboxDetail'));
const DailyBreadEdit = lazy(() => import('./screens/DailyBreadEdit'));
const SermonEdit = lazy(() => import('./screens/SermonEdit'));
const WeeklyEdit = lazy(() => import('./screens/WeeklyEdit'));
const AnnouncementEdit = lazy(() => import('./screens/AnnouncementEdit'));
const Roster = lazy(() => import('./screens/Roster'));
const Services = lazy(() => import('./screens/Services'));
const ServiceEdit = lazy(() => import('./screens/ServiceEdit'));
const Groups = lazy(() => import('./screens/Groups'));
const Staff = lazy(() => import('./screens/Staff'));

/** Hides admin-only screens from editors (RLS blocks the data anyway). */
function AdminOnly({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { staff } = useAuth();
  if (staff?.role !== 'admin') return <PageHead title={t('auth.notAuthorizedTitle')}>{t('admin.common.noPermission')}</PageHead>;
  return <>{children}</>;
}

export default function AdminApp() {
  useNoIndex();
  return (
    <RequireStaff>
      <ToastProvider>
        <AdminShell>
          <Suspense fallback={<Loading lines={5} className="max-w-xl" />}>
            <Routes>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/inbox" element={<Inbox />} />
              <Route path="/admin/inbox/:id" element={<InboxDetail />} />
              <Route path="/admin/daily-bread" element={<DailyBreadList />} />
              <Route path="/admin/daily-bread/:id" element={<DailyBreadEdit />} />
              <Route path="/admin/sermons" element={<SermonList />} />
              <Route path="/admin/sermons/:id" element={<SermonEdit />} />
              <Route path="/admin/weekly" element={<WeeklyList />} />
              <Route path="/admin/weekly/:id" element={<WeeklyEdit />} />
              <Route path="/admin/announcements" element={<AnnouncementList />} />
              <Route path="/admin/announcements/:id" element={<AnnouncementEdit />} />
              <Route path="/admin/services" element={<Services />} />
              <Route path="/admin/services/:id" element={<ServiceEdit />} />
              <Route path="/admin/roster" element={<Roster />} />
              <Route path="/admin/groups" element={<AdminOnly><Groups /></AdminOnly>} />
              <Route path="/admin/staff" element={<AdminOnly><Staff /></AdminOnly>} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </Suspense>
        </AdminShell>
      </ToastProvider>
    </RequireStaff>
  );
}
