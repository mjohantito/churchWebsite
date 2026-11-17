import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Empty, Loading, LoadError } from '../../components/QueryState';
import { Icon } from '../../components/Icon';
import { useInbox } from '../../data/admin/hooks';
import { listSubmissions, submissionsToCsv, type Submission, type SubmissionStatus, type SubmissionType } from '../../data/admin/inbox';
import { useAuth } from '../../auth/AuthContext';
import { useLocalized } from '../../lib/useLocalized';
import { Button, PageHead, SelectField, TextField } from '../ui';
import { useAdminError } from '../useAdminError';

export const TYPES: SubmissionType[] = ['new_member', 'prayer', 'choir', 'baptism', 'contact'];
export const STATUSES: SubmissionStatus[] = ['new', 'contacted', 'done'];

export function useDateTime() {
  const { lang } = useLocalized();
  return (iso: string) =>
    new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(new Date(iso));
}

/** One row in the inbox (also used on the dashboard). */
export function SubmissionItem({ s }: { s: Submission }) {
  const { t } = useTranslation();
  const fmt = useDateTime();
  const isNew = s.status === 'new';
  return (
    <Link to={`/admin/inbox/${s.id}`} className={`admin-list__item ${isNew ? 'is-new' : ''}`}>
      <span className="admin-list__meta">
        {isNew && <span className="new-dot" aria-hidden="true" />}
        {fmt(s.created_at)}
      </span>
      <span className="admin-list__main">
        <span className={isNew ? 'font-bold' : 'font-medium'}>{s.full_name}</span>
        <span className="text-sm text-stone-600">
          {t(`admin.inbox.types.${s.type}`)}
          {s.phone ? ` · ${s.phone}` : ''}
          {s.email ? ` · ${s.email}` : ''}
        </span>
      </span>
      <span className={`badge badge--${s.status}`}>{t(`admin.inbox.statuses.${s.status}`)}</span>
      <Icon name="arrow-right-linear" className="hidden h-5 w-5 sm:block" />
    </Link>
  );
}

export default function Inbox() {
  const { t } = useTranslation();
  const { staff } = useAuth();
  const onError = useAdminError();
  const [params, setParams] = useSearchParams();
  const type = (params.get('type') ?? '') as SubmissionType | '';
  const status = (params.get('status') ?? '') as SubmissionStatus | '';
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [exporting, setExporting] = useState(false);

  // Debounce the name search into the URL (keeps filters shareable and back-button friendly).
  useEffect(() => {
    const h = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      if (search.trim()) next.set('q', search.trim());
      else next.delete('q');
      if (next.toString() !== params.toString()) setParams(next, { replace: true });
    }, 300);
    return () => window.clearTimeout(h);
  }, [search, params, setParams]);

  const filter = { type, status, search: params.get('q') ?? '' };
  const list = useInbox(filter);
  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows = await listSubmissions(filter, 5000);
      const headers = ['created_at', 'type', 'status', 'full_name', 'phone', 'email', 'message', 'extra', 'staff_notes'].map((h) => t(`admin.inbox.csv.${h}` as 'admin.inbox.csv.type'));
      const blob = new Blob([submissionsToCsv(rows, headers)], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `formulir-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      onError(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHead
        title={t('admin.nav.inbox')}
        actions={staff?.role === 'admin' ? <Button icon="download-minimalistic-linear" busy={exporting} onClick={() => void exportCsv()}>{t('admin.inbox.exportCsv')}</Button> : undefined}
      />
      <div className="filter-bar">
        <SelectField label={t('admin.inbox.filterType')} value={type} onChange={(v) => setParam('type', v)}
          options={[{ value: '', label: t('admin.common.all') }, ...TYPES.map((x) => ({ value: x, label: t(`admin.inbox.types.${x}`) }))]} />
        <SelectField label={t('admin.inbox.filterStatus')} value={status} onChange={(v) => setParam('status', v)}
          options={[{ value: '', label: t('admin.common.all') }, ...STATUSES.map((x) => ({ value: x, label: t(`admin.inbox.statuses.${x}`) }))]} />
        <TextField label={t('admin.inbox.searchName')} type="search" value={search} onChange={setSearch} autoComplete="off" />
      </div>
      {list.isPending ? (
        <Loading lines={5} className="max-w-xl" />
      ) : list.isError ? (
        <LoadError onRetry={() => void list.refetch()} />
      ) : list.data.length === 0 ? (
        <Empty>{t('admin.inbox.empty')}</Empty>
      ) : (
        <>
          <p className="mb-2 text-sm text-stone-600" aria-live="polite">{t('admin.inbox.count', { count: list.data.length })}</p>
          <ul className="admin-list">
            {list.data.map((s) => <li key={s.id}><SubmissionItem s={s} /></li>)}
          </ul>
        </>
      )}
    </>
  );
}
