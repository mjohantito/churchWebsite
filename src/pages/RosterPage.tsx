import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/PageHeader';
import { Icon } from '../components/Icon';
import { Empty, Loading, LoadError } from '../components/QueryState';
import { useRoster } from '../data/queries';
import type { DutyService } from '../data/types';
import { addDays, isIsoDate, jakartaToday, mondayOf } from '../lib/dates';
import { useLocalized } from '../lib/useLocalized';

const SERVICES: DutyService[] = ['sun_am', 'sun_pm', 'wed'];

export function RosterPage() {
  const { t } = useTranslation();
  const { pick, lang } = useLocalized();
  const [params, setParams] = useSearchParams();
  const thisWeek = mondayOf(jakartaToday());
  const requested = params.get('week');
  const week = isIsoDate(requested) ? mondayOf(requested) : thisWeek;
  const roster = useRoster(week);

  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', { ...opts, timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
  const range = `${fmt(week, { day: 'numeric', month: 'short' })} – ${fmt(addDays(week, 6), { day: 'numeric', month: 'short', year: 'numeric' })}`;
  const go = (iso: string) => setParams(iso === thisWeek ? {} : { week: iso });

  const hasAny = roster.data && Object.keys(roster.data.names).length > 0;

  return (
    <>
      <PageHeader eyebrow={t('roster.eyebrow')} title={t('nav.roster')} intro={t('roster.intro')}>
        <div className="flex flex-wrap items-center gap-3" role="group" aria-label={t('roster.weekOf', { range })}>
          <button type="button" className="round-button" aria-label={t('roster.prevWeek')} onClick={() => go(addDays(week, -7))}>
            <Icon name="arrow-left-linear" />
          </button>
          <p className="min-w-[12rem] text-center font-medium" aria-live="polite">
            {t('roster.weekOf', { range })}
          </p>
          <button type="button" className="round-button" aria-label={t('roster.nextWeek')} onClick={() => go(addDays(week, 7))}>
            <Icon name="arrow-right-linear" />
          </button>
          {week !== thisWeek && (
            <button type="button" className="text-link" onClick={() => go(thisWeek)}>
              {t('roster.thisWeek')}
            </button>
          )}
        </div>
      </PageHeader>

      <div className="page-x mx-auto mt-12 max-w-page">
        {roster.isPending ? (
          <Loading lines={5} className="max-w-2xl" />
        ) : roster.isError ? (
          <LoadError onRetry={() => void roster.refetch()} />
        ) : !hasAny ? (
          <Empty>{t('roster.empty')}</Empty>
        ) : (
          <div className="table-scroll" role="region" aria-label={t('roster.caption', { range })} tabIndex={0}>
            <table className="roster-table">
              <caption className="sr-only">{t('roster.caption', { range })}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('roster.roleHeader')}</th>
                  {SERVICES.map((s) => (
                    <th key={s} scope="col">{t(`roster.services.${s}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roster.data.roles.map((role) => (
                  <tr key={role.id}>
                    <th scope="row">{pick(role.name)}</th>
                    {SERVICES.map((s) => {
                      const names = roster.data.names[role.id]?.[s];
                      return (
                        <td key={s}>
                          {names ?? <span className="text-stone-500">{t('roster.unassigned')}</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
