import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Empty, Loading, LoadError } from '../../components/QueryState';
import { Icon } from '../../components/Icon';
import { useWeekRange } from '../../components/WeekNav';
import { useAllGroups, useCopyAnnouncements, useReorderAnnouncements, useWeekAnnouncements } from '../../data/admin/hooks';
import type { AnnouncementRow } from '../../data/admin/announcements';
import { isIsoDate } from '../../lib/dates';
import { addWeeks, currentWeekStart, getWeekStart } from '../../lib/week';
import { Button, ButtonLink, Card, ConfirmDialog, PageHead, StatusBadge, TextField } from '../ui';
import { useToast } from '../Toast';
import { useAdminError } from '../useAdminError';

const BASE = '/admin/announcements';

/** /admin/announcements: one week at a time, in public display order. */
export default function Announcements() {
  const { t } = useTranslation();
  const range = useWeekRange();
  const toast = useToast();
  const onError = useAdminError();
  const [params, setParams] = useSearchParams();
  const thisWeek = currentWeekStart();
  const week = isIsoDate(params.get('week')) ? getWeekStart(params.get('week')!) : thisWeek;
  const goTo = (iso: string) => setParams(getWeekStart(iso) === thisWeek ? {} : { week: getWeekStart(iso) });

  const list = useWeekAnnouncements(week);
  const groups = useAllGroups();
  const reorder = useReorderAnnouncements();
  const copy = useCopyAnnouncements();
  const [confirmAll, setConfirmAll] = useState(false);
  const rows = list.data ?? [];
  const groupName = new Map((groups.data ?? []).map((g) => [g.id, g.name]));
  const nextRange = range(addWeeks(week, 1));

  const move = (i: number, dir: -1 | 1) => {
    const ids = rows.map((r) => r.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    reorder.mutate({ week, ids }, { onSuccess: () => toast.success(t('admin.toast.saved')), onError });
  };

  const copyIds = (ids: string[]) =>
    copy.mutate(ids, {
      onSuccess: (n) => {
        setConfirmAll(false);
        toast.success(t('admin.announcements.copied', { count: n, range: nextRange }));
      },
      onError: (e) => {
        setConfirmAll(false);
        onError(e);
      },
    });

  return (
    <>
      <PageHead title={t('admin.nav.announcements')}
        actions={<ButtonLink to={`${BASE}/new?week=${week}`} variant="primary" icon="add-circle-linear">{t('admin.announcements.add')}</ButtonLink>}>
        {t('admin.announcements.hint')}
      </PageHead>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <Button icon="arrow-left-linear" aria-label={t('admin.announcements.prevWeek')} onClick={() => goTo(addWeeks(week, -1))} />
          <p className="min-w-[11rem] text-center font-bold" aria-live="polite">{range(week)}</p>
          <Button icon="arrow-right-linear" aria-label={t('admin.announcements.nextWeek')} onClick={() => goTo(addWeeks(week, 1))} />
          {week !== thisWeek && <Button variant="ghost" onClick={() => goTo(thisWeek)}>{t('admin.announcements.thisWeek')}</Button>}
          <TextField label={t('admin.announcements.pickDate')} type="date" value={week} className="ml-auto w-full sm:w-auto"
            onChange={(v) => isIsoDate(v) && goTo(v)} />
        </div>
      </Card>

      <div className="mt-6">
        {list.isPending ? (
          <Loading lines={5} className="max-w-xl" />
        ) : list.isError ? (
          <LoadError onRetry={() => void list.refetch()} />
        ) : rows.length === 0 ? (
          <Empty>{t('admin.announcements.emptyWeek')}</Empty>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone-600">{t('admin.announcements.count', { count: rows.length })}</p>
              <Button icon="copy-linear" busy={copy.isPending && confirmAll} onClick={() => setConfirmAll(true)}>
                {t('admin.announcements.copyAll')}
              </Button>
            </div>
            <ol className="space-y-3" aria-label={t('admin.announcements.order')}>
              {rows.map((r, i) => (
                <Row key={r.id} r={r} group={groupName.get(r.group_id)} first={i === 0} last={i === rows.length - 1}
                  busy={reorder.isPending || copy.isPending} onMove={(d) => move(i, d)} onCopy={() => copyIds([r.id])} />
              ))}
            </ol>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmAll}
        title={t('admin.announcements.copyAllTitle')}
        body={t('admin.announcements.copyAllBody', { count: rows.length, range: nextRange })}
        confirmLabel={t('admin.announcements.copyAll')}
        cancelLabel={t('admin.common.cancel')}
        busy={copy.isPending}
        onConfirm={() => copyIds(rows.map((r) => r.id))}
        onCancel={() => setConfirmAll(false)}
      />
    </>
  );
}

function Row({ r, group, first, last, busy, onMove, onCopy }: {
  r: AnnouncementRow; group?: string; first: boolean; last: boolean; busy: boolean; onMove: (d: -1 | 1) => void; onCopy: () => void;
}) {
  const { t } = useTranslation();
  return (
    <li className="service-row">
      <div className="flex flex-col gap-1">
        <button type="button" className="icon-button" aria-label={`${t('admin.common.moveUp')}: ${r.title_id}`} disabled={first || busy} onClick={() => onMove(-1)}>
          <Icon name="arrow-up-linear" className="h-5 w-5" />
        </button>
        <button type="button" className="icon-button" aria-label={`${t('admin.common.moveDown')}: ${r.title_id}`} disabled={last || busy} onClick={() => onMove(1)}>
          <Icon name="arrow-down-linear" className="h-5 w-5" />
        </button>
      </div>
      <div className="min-w-0 flex-1 basis-56">
        <p className="flex flex-wrap items-center gap-2">
          <StatusBadge status={r.status} />
          {group && <span className="text-sm text-stone-600">{group}</span>}
        </p>
        <p className="mt-1 text-lg font-bold [overflow-wrap:anywhere]">{r.title_id}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button icon="copy-linear" disabled={busy} onClick={onCopy}>
          {t('admin.announcements.copyNext')}
          <span className="sr-only">: {r.title_id}</span>
        </Button>
        <Link to={`${BASE}/${r.id}`} className="abtn abtn--secondary">
          <Icon name="pen-2-linear" className="h-5 w-5" />
          {t('admin.common.edit')}
          <span className="sr-only">: {r.title_id}</span>
        </Link>
      </div>
    </li>
  );
}
