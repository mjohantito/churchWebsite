import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Empty, Loading, LoadError } from '../../components/QueryState';
import { Icon } from '../../components/Icon';
import { useRoles, useRosterCells, useSaveRole, useSaveRoster } from '../../data/admin/hooks';
import { getRosterCells, type DutyRole, type DutyService, type RosterCells } from '../../data/admin/roster';
import { CHURCH_INFO } from '../../data/churchInfo';
import { useAuth } from '../../auth/AuthContext';
import { addDays, isIsoDate, jakartaToday, mondayOf } from '../../lib/dates';
import { useLocalized } from '../../lib/useLocalized';
import { Button, Card, PageHead, TextField } from '../ui';
import { useToast } from '../Toast';
import { useAdminError } from '../useAdminError';
import { useUnsavedGuard } from '../useUnsavedGuard';

const SERVICES: DutyService[] = ['sun_am', 'sun_pm', 'wed'];
const SERVICE_TIME: Record<DutyService, string> = {
  sun_am: CHURCH_INFO.services.sunday[0],
  sun_pm: CHURCH_INFO.services.sunday[1],
  wed: CHURCH_INFO.services.wednesdayPrayer[0],
};

export default function Roster() {
  const { t } = useTranslation();
  const { pick, lang, time } = useLocalized();
  const { staff } = useAuth();
  const toast = useToast();
  const onError = useAdminError();
  const [params, setParams] = useSearchParams();
  const thisWeek = mondayOf(jakartaToday());
  const week = isIsoDate(params.get('week')) ? mondayOf(params.get('week')!) : thisWeek;

  const roles = useRoles(false);
  const saved = useRosterCells(week);
  const save = useSaveRoster();
  const [cells, setCells] = useState<RosterCells>({});
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (saved.data) setCells(structuredClone(saved.data));
  }, [saved.data]);

  const norm = (c: RosterCells) => JSON.stringify(Object.fromEntries(Object.entries(c).map(([r, s]) => [r, Object.fromEntries(Object.entries(s ?? {}).filter(([, v]) => (v ?? '').trim()).map(([k, v]) => [k, (v ?? '').trim()]))]).filter(([, s]) => Object.keys(s).length)));
  const dirty = Boolean(saved.data) && norm(cells) !== norm(saved.data ?? {});
  const guard = useUnsavedGuard(dirty);

  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', { ...opts, timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
  const range = `${fmt(week, { weekday: 'short', day: 'numeric', month: 'short' })} – ${fmt(addDays(week, 6), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`;
  const serviceLabel = (s: DutyService) => t(`admin.roster.services.${s}`, { time: time(SERVICE_TIME[s]) });
  const goTo = (iso: string) => setParams(iso === thisWeek ? {} : { week: mondayOf(iso) });

  const setCell = (roleId: string, s: DutyService, v: string) =>
    setCells((c) => ({ ...c, [roleId]: { ...(c[roleId] ?? {}), [s]: v } }));

  const copyLastWeek = async () => {
    setCopying(true);
    try {
      const prev = await getRosterCells(addDays(week, -7));
      const any = Object.values(prev).some((s) => Object.values(s).some((v) => (v ?? '').trim()));
      if (!any) {
        toast.error(t('admin.roster.nothingToCopy'));
        return;
      }
      setCells((c) => {
        const next = { ...c };
        for (const [roleId, services] of Object.entries(prev)) next[roleId] = { ...(next[roleId] ?? {}), ...services };
        return next;
      });
      toast.success(t('admin.roster.copied'));
    } catch (err) {
      onError(err);
    } finally {
      setCopying(false);
    }
  };

  const onSave = async () => {
    try {
      const n = await save.mutateAsync({ week, cells, before: saved.data ?? {} });
      toast.success(n ? t('admin.roster.saved') : t('admin.roster.noChanges'));
    } catch (err) {
      onError(err);
    }
  };

  const activeRoles = roles.data ?? [];

  return (
    <>
      <PageHead title={t('admin.nav.roster')} />
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <Button icon="arrow-left-linear" aria-label={t('admin.roster.prev')} onClick={() => goTo(addDays(week, -7))} />
          <p className="min-w-[13rem] text-center font-bold" aria-live="polite">{range}</p>
          <Button icon="arrow-right-linear" aria-label={t('admin.roster.next')} onClick={() => goTo(addDays(week, 7))} />
          {week !== thisWeek && <Button variant="ghost" onClick={() => goTo(thisWeek)}>{t('admin.roster.thisWeek')}</Button>}
          <TextField label={t('admin.roster.pickWeek')} type="date" value={week} className="ml-auto w-full sm:w-auto"
            onChange={(v) => isIsoDate(v) && goTo(v)} />
        </div>
      </Card>

      <Card className="mt-6">
        {roles.isPending || saved.isPending ? (
          <Loading lines={5} />
        ) : roles.isError || saved.isError ? (
          <LoadError onRetry={() => { void roles.refetch(); void saved.refetch(); }} />
        ) : activeRoles.length === 0 ? (
          <Empty>{t('admin.roster.noRoles')}</Empty>
        ) : (
          <>
            {/* Wide screens: grid */}
            <div className="hidden overflow-x-auto md:block">
              <table className="admin-grid">
                <caption className="sr-only">{t('admin.roster.caption', { range })}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t('admin.roster.role')}</th>
                    {SERVICES.map((s) => <th key={s} scope="col">{serviceLabel(s)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {activeRoles.map((r) => (
                    <tr key={r.id}>
                      <th scope="row">{pick({ id: r.name_id, en: r.name_en })}</th>
                      {SERVICES.map((s) => (
                        <td key={s}>
                          <input className="field-control" value={cells[r.id]?.[s] ?? ''} maxLength={500}
                            aria-label={t('admin.roster.cellLabel', { role: pick({ id: r.name_id, en: r.name_en }), service: serviceLabel(s) })}
                            placeholder={t('admin.roster.namesPlaceholder')} onChange={(e) => setCell(r.id, s, e.target.value)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Phones: one block per service */}
            <div className="space-y-8 md:hidden">
              {SERVICES.map((s) => (
                <fieldset key={s}>
                  <legend className="admin-h2">{serviceLabel(s)}</legend>
                  <div className="mt-3 space-y-4">
                    {activeRoles.map((r) => (
                      <TextField key={r.id} label={pick({ id: r.name_id, en: r.name_en })} value={cells[r.id]?.[s] ?? ''} maxLength={500}
                        placeholder={t('admin.roster.namesPlaceholder')} onChange={(v) => setCell(r.id, s, v)} />
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
            <p className="field-hint mt-4">{t('admin.roster.hint')}</p>
            <div className="editor-actions">
              <Button variant="primary" busy={save.isPending} disabled={!dirty} onClick={() => void onSave()}>{t('admin.roster.save')}</Button>
              <Button icon="refresh-linear" busy={copying} onClick={() => void copyLastWeek()}>{t('admin.roster.copyLast')}</Button>
              {dirty && <span className="badge badge--warn self-center">{t('admin.common.unsaved')}</span>}
            </div>
          </>
        )}
      </Card>

      {staff?.role === 'admin' && <RoleManager />}
      {guard.dialog}
    </>
  );
}

/** Admin: add, rename, reorder, activate/deactivate roles. Roles are never deleted (history stays intact). */
function RoleManager() {
  const { t } = useTranslation();
  const roles = useRoles(true);
  const saveRole = useSaveRole();
  const toast = useToast();
  const onError = useAdminError();
  const [draft, setDraft] = useState({ name_id: '', name_en: '' });
  const list = useMemo(() => roles.data ?? [], [roles.data]);

  const persist = async (id: string | null, input: Pick<DutyRole, 'name_id' | 'name_en' | 'sort_order' | 'active'>, msg = t('admin.toast.saved')) => {
    try {
      await saveRole.mutateAsync({ id, input });
      toast.success(msg);
      return true;
    } catch (err) {
      onError(err);
      return false;
    }
  };
  const move = async (index: number, dir: -1 | 1) => {
    const a = list[index];
    const b = list[index + dir];
    if (!a || !b) return;
    // Swap positions; normalise to the list index so equal sort_orders still move.
    await persist(a.id, { ...a, sort_order: index + dir + 1 });
    await persist(b.id, { ...b, sort_order: index + 1 });
  };

  return (
    <Card className="mt-6">
      <h2 className="admin-h2">{t('admin.roster.rolesTitle')}</h2>
      <p className="field-hint">{t('admin.roster.rolesHint')}</p>
      {roles.isPending ? <Loading lines={3} className="mt-4" /> : (
        <ul className="mt-4 space-y-3">
          {list.map((r, i) => (
            <NameRow key={r.id} idValue={r.name_id} enValue={r.name_en ?? ''} active={r.active} first={i === 0} last={i === list.length - 1}
              busy={saveRole.isPending}
              onSave={(name_id, name_en) => persist(r.id, { ...r, name_id, name_en: name_en || null })}
              onToggle={() => persist(r.id, { ...r, active: !r.active })}
              onMove={(d) => void move(i, d)} />
          ))}
        </ul>
      )}
      <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={async (e) => {
        e.preventDefault();
        if (!draft.name_id.trim()) return;
        if (await persist(null, { name_id: draft.name_id.trim(), name_en: draft.name_en.trim() || null, sort_order: list.length + 1, active: true })) setDraft({ name_id: '', name_en: '' });
      }}>
        <TextField label={t('admin.roster.nameId')} required value={draft.name_id} onChange={(v) => setDraft((d) => ({ ...d, name_id: v }))} maxLength={120} />
        <TextField label={t('admin.roster.nameEn')} value={draft.name_en} onChange={(v) => setDraft((d) => ({ ...d, name_en: v }))} maxLength={120} />
        <Button type="submit" variant="primary" disabled={!draft.name_id.trim()} busy={saveRole.isPending}>{t('admin.roster.addRole')}</Button>
      </form>
    </Card>
  );
}

/** One editable name row with reorder + active toggle (used for roles and groups). */
export function NameRow({ idValue, enValue, active, first, last, busy, onSave, onToggle, onMove, enLabel, idLabel, extra }: {
  idValue: string; enValue?: string; active: boolean; first: boolean; last: boolean; busy: boolean;
  onSave: (idValue: string, enValue: string) => Promise<boolean>; onToggle: () => void; onMove: (dir: -1 | 1) => void;
  idLabel?: string; enLabel?: string | null; extra?: string;
}) {
  const { t } = useTranslation();
  const [a, setA] = useState(idValue);
  const [b, setB] = useState(enValue ?? '');
  useEffect(() => { setA(idValue); setB(enValue ?? ''); }, [idValue, enValue]);
  const changed = a.trim() !== idValue || (enLabel !== null && b.trim() !== (enValue ?? ''));
  return (
    <li className={`name-row ${active ? '' : 'is-inactive'}`}>
      <div className="flex flex-col gap-1">
        <button type="button" className="icon-button" aria-label={t('admin.common.moveUp')} disabled={first || busy} onClick={() => onMove(-1)}>
          <Icon name="arrow-left-linear" className="h-5 w-5 rotate-90" />
        </button>
        <button type="button" className="icon-button" aria-label={t('admin.common.moveDown')} disabled={last || busy} onClick={() => onMove(1)}>
          <Icon name="arrow-left-linear" className="h-5 w-5 -rotate-90" />
        </button>
      </div>
      <div className="grid flex-1 gap-3 sm:grid-cols-2">
        <TextField label={idLabel ?? t('admin.roster.nameId')} required value={a} onChange={setA} maxLength={120} hint={extra} />
        {enLabel !== null && <TextField label={enLabel ?? t('admin.roster.nameEn')} value={b} onChange={setB} maxLength={120} />}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
        <Button variant="primary" disabled={!changed || !a.trim()} busy={busy && changed} onClick={() => void onSave(a.trim(), b.trim())}>{t('admin.common.save')}</Button>
        <Button variant="ghost" disabled={busy} onClick={onToggle} aria-pressed={active}>
          {active ? t('admin.common.deactivate') : t('admin.common.activate')}
        </Button>
        {!active && <span className="badge badge--muted">{t('admin.common.inactive')}</span>}
      </div>
    </li>
  );
}
