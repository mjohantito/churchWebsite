import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/PageHeader';
import { Prose } from '../components/Prose';
import { Icon } from '../components/Icon';
import { WeekNav, useWeekRange } from '../components/WeekNav';
import { Empty, Loading, LoadError } from '../components/QueryState';
import { useAnnouncement, useAnnouncementWeeks, useAnnouncementsForWeek, useGroups } from '../data/queries';
import type { AnnouncementView } from '../data/types';
import { isIsoDate } from '../lib/dates';
import { currentWeekStart, getWeekStart } from '../lib/week';
import { useScroll } from '../lib/motion';
import { useLocalized } from '../lib/useLocalized';

/** /pengumuman (one week at a time) and /pengumuman/:id (direct link to one item). */
export function AnnouncementsPage() {
  const { id } = useParams<{ id?: string }>();
  return id ? <AnnouncementDetail id={id} /> : <WeekList />;
}

/** Query string for the list: ?week= (omitted for the current week) and ?group=. */
function listHref(week: string, group: string | null, thisWeek: string, hash = '') {
  const q = new URLSearchParams();
  if (week !== thisWeek) q.set('week', week);
  if (group) q.set('group', group);
  const s = q.toString();
  return `/pengumuman${s ? `?${s}` : ''}${hash}`;
}

function WeekList() {
  const { t } = useTranslation();
  const range = useWeekRange();
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const scroll = useScroll();
  const thisWeek = currentWeekStart();
  const requested = params.get('week');
  const week = isIsoDate(requested) ? getWeekStart(requested) : thisWeek;
  const group = params.get('group');

  const groups = useGroups();
  const weeks = useAnnouncementWeeks();
  const list = useAnnouncementsForWeek(week);

  // Navigator: weeks with published announcements, plus the current week.
  const allowed = [...new Set([...(weeks.data ?? []), thisWeek])].sort();
  const prev = allowed.filter((w) => w < week).pop() ?? null;
  const next = allowed.find((w) => w > week) ?? null;
  // Empty current week: point to the most recent earlier week, else the next one with announcements.
  const published = weeks.data ?? [];
  const latest = published.filter((w) => w < thisWeek).pop() ?? published.find((w) => w > thisWeek) ?? null;

  const go = (w: string) => {
    const q = new URLSearchParams();
    if (w !== thisWeek) q.set('week', w);
    if (group) q.set('group', group);
    setParams(q);
  };

  const all = list.data ?? [];
  const items = group ? all.filter((a) => a.group?.slug === group) : all;

  // Direct link to #pengumuman-<id>: scroll there once the week has loaded.
  useEffect(() => {
    if (!hash.startsWith('#pengumuman-') || !list.data) return;
    // After the route-change scroll reset and ScrollTrigger.refresh (next frame).
    const timer = window.setTimeout(() => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) scroll.scrollToElement(el);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [hash, list.data, scroll]);

  return (
    <>
      <PageHeader eyebrow={t('announcements.eyebrow')} title={t('nav.announcements')} intro={t('announcements.intro')}>
        <div className="flex flex-col gap-6">
          <WeekNav
            week={week}
            thisWeek={thisWeek}
            prev={prev}
            next={next}
            onGo={go}
            labels={{ group: t('announcements.weekNav'), prev: t('announcements.prevWeek'), next: t('announcements.nextWeek'), thisWeek: t('announcements.thisWeek') }}
          />
          <nav aria-label={t('announcements.filterLabel')}>
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link to={listHref(week, null, thisWeek)} className="filter-chip" aria-current={!group ? 'page' : undefined}>
                  {t('announcements.all')}
                </Link>
              </li>
              {(groups.data ?? []).map((g) => (
                <li key={g.id}>
                  <Link to={listHref(week, g.slug, thisWeek)} className="filter-chip" aria-current={group === g.slug ? 'page' : undefined}>
                    {g.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </PageHeader>

      <div className="page-x mx-auto mt-6 max-w-page sm:mt-8">
        <div className="max-w-[46rem]">
          {list.isPending ? (
            <Loading lines={6} />
          ) : list.isError ? (
            <LoadError onRetry={() => void list.refetch()} />
          ) : items.length === 0 ? (
            <div className="ann-empty">
              {all.length > 0 && group ? (
                <>
                  <Empty>{t('announcements.emptyGroupWeek')}</Empty>
                  <Link to={listHref(week, null, thisWeek)} className="text-link">{t('announcements.showAllGroups')}</Link>
                </>
              ) : week === thisWeek ? (
                <>
                  <Empty>{t('announcements.emptyThisWeek')}</Empty>
                  {latest && (
                    <Link to={listHref(latest, group, thisWeek)} className="text-link">
                      {t('announcements.seeLatest', { range: range(latest) })}
                      <Icon name="arrow-right-linear" className="h-4 w-4" />
                    </Link>
                  )}
                </>
              ) : (
                <Empty>{t('announcements.emptyWeek')}</Empty>
              )}
            </div>
          ) : (
            <section aria-label={t('announcements.listLabel', { range: range(week) })} className="ann-list">
              {items.map((a) => (
                <AnnouncementItem key={a.id} a={a} />
              ))}
            </section>
          )}
        </div>
      </div>
    </>
  );
}

/** One announcement: group tag, title, body (clamped to ~6 lines), optional image. */
function AnnouncementItem({ a, clamp = true }: { a: AnnouncementView; clamp?: boolean }) {
  const { t } = useTranslation();
  const { pick } = useLocalized();
  const titleId = `pengumuman-${a.id}-title`;
  return (
    <article id={`pengumuman-${a.id}`} className="ann-item" aria-labelledby={titleId}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {a.group ? <span className="tag tag--accent">{a.group.name}</span> : <span />}
        {clamp && (
          <Link to={`/pengumuman/${a.id}`} className="ann-item__permalink" aria-label={t('announcements.permalinkLabel', { title: pick(a.title) })}>
            <Icon name="link-minimalistic-2-linear" className="h-4 w-4" />
            {t('announcements.permalink')}
          </Link>
        )}
      </div>
      <h2 id={titleId} className="ann-item__title">{pick(a.title)}</h2>
      {clamp ? <ClampedBody text={pick(a.body)} title={pick(a.title)} /> : <Prose text={pick(a.body)} className="ann-item__body" />}
      {a.image_url && <img src={a.image_url} alt="" className="ann-item__image" loading="lazy" decoding="async" />}
    </article>
  );
}

/** Long text is clamped to about 6 lines with a "read more" toggle. */
function ClampedBody({ text, title }: { text: string; title: string }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 2);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, open]);

  return (
    <>
      <div id={id} ref={ref} className={`ann-item__body ${open ? '' : 'is-clamped'} ${overflows && !open ? 'has-more' : ''}`}>
        <Prose text={text} />
      </div>
      {(overflows || open) && (
        <button type="button" className="ann-item__more" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
          {open ? t('announcements.showLess') : t('announcements.readMore')}
          <span className="sr-only">: {title}</span>
          <Icon name="arrow-down-linear" className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
    </>
  );
}

function AnnouncementDetail({ id }: { id: string }) {
  const { t } = useTranslation();
  const range = useWeekRange();
  const item = useAnnouncement(id);
  const thisWeek = currentWeekStart();

  return (
    <>
      <PageHeader eyebrow={t('announcements.eyebrow')} title={t('nav.announcements')}>
        <Link to="/pengumuman" className="text-link">
          <Icon name="arrow-left-linear" className="h-4 w-4" />
          {t('announcements.backToAll')}
        </Link>
      </PageHeader>

      <div className="page-x mx-auto mt-8 max-w-page sm:mt-10">
        <div className="max-w-[46rem]">
          {item.isPending ? (
            <Loading lines={6} />
          ) : item.isError ? (
            <LoadError onRetry={() => void item.refetch()} />
          ) : !item.data ? (
            <Empty>{t('announcements.notFound')}</Empty>
          ) : (
            <>
              <div className="ann-list">
                <AnnouncementItem a={item.data} clamp={false} />
              </div>
              <Link to={listHref(item.data.week_start, null, thisWeek, `#pengumuman-${item.data.id}`)} className="text-link mt-8">
                {t('announcements.seeWeek', { range: range(item.data.week_start) })}
                <Icon name="arrow-right-linear" className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
