import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/PageHeader';
import { Prose } from '../components/Prose';
import { Icon } from '../components/Icon';
import { Empty, Loading, LoadError } from '../components/QueryState';
import { useFileSize, useSermon, useSermonList, useSermonNeighbours, useSermonYears } from '../data/queries';
import { cleanSearch } from '../data/sermons';
import type { SermonLink, SermonView } from '../data/types';
import { excerpt } from '../lib/markdown';
import { useLocalized } from '../lib/useLocalized';

/** /sermons (history) and /sermons/:slug (one sermon). */
export function SermonsPage() {
  const { slug } = useParams<{ slug?: string }>();
  return slug ? <SermonDetail slug={slug} /> : <SermonList />;
}

function useDates() {
  const { lang } = useLocalized();
  const locale = lang === 'id' ? 'id-ID' : 'en-GB';
  // preached_on is a Jakarta calendar date (YYYY-MM-DD): format it as-is.
  return useCallback((iso: string, weekday = false) =>
    new Intl.DateTimeFormat(locale, { ...(weekday ? { weekday: 'long' } : {}), day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(`${iso}T00:00:00Z`)), [locale]);
}

/* ------------------------------------------------------------------ */
/* List                                                                 */
/* ------------------------------------------------------------------ */

function SermonList() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const q = cleanSearch(params.get('q'));
  const yearParam = Number(params.get('year'));
  const year = Number.isInteger(yearParam) && yearParam > 1900 ? yearParam : null;
  const years = useSermonYears();
  const list = useSermonList(q, year);
  const [draft, setDraft] = useState(params.get('q') ?? '');
  const searchId = useId();

  // Debounced search into the URL (?q=), keeping the year.
  const pushed = useRef(q);
  useEffect(() => {
    const next = cleanSearch(draft);
    if (next === q) return;
    const timer = window.setTimeout(() => {
      const p = new URLSearchParams(params);
      if (next) p.set('q', next); else p.delete('q');
      pushed.current = next;
      setParams(p, { replace: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draft, q, params, setParams]);
  // The URL changed some other way (link, back/forward): follow it.
  useEffect(() => {
    if (q === pushed.current) return;
    pushed.current = q;
    setDraft(q);
  }, [q]);

  const yearHref = (y: number | null) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (y) p.set('year', String(y));
    const s = p.toString();
    return `/sermons${s ? `?${s}` : ''}`;
  };
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const groups: { year: string; items: SermonView[] }[] = [];
  for (const s of items) {
    const y = s.preached_on.slice(0, 4);
    if (groups.at(-1)?.year !== y) groups.push({ year: y, items: [] });
    groups.at(-1)!.items.push(s);
  }
  const filtered = Boolean(q || year);

  return (
    <>
      <PageHeader eyebrow={t('sermons.eyebrow')} title={t('nav.sermons')} intro={t('sermons.intro')}>
        <div className="flex flex-col gap-6">
          <form role="search" className="sermon-search" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor={searchId} className="field-label">{t('sermons.searchLabel')}</label>
            <div className="sermon-search__row">
              <Icon name="magnifer-linear" className="sermon-search__icon h-5 w-5" />
              <input id={searchId} type="search" className="field-control sermon-search__input" value={draft}
                placeholder={t('sermons.searchPlaceholder')} autoComplete="off" maxLength={60}
                onChange={(e) => setDraft(e.target.value)} />
              {draft && (
                <button type="button" className="sermon-search__clear" aria-label={t('sermons.clearSearch')} onClick={() => setDraft('')}>
                  <Icon name="close-circle-linear" className="h-5 w-5" />
                </button>
              )}
            </div>
          </form>
          {(years.data?.length ?? 0) > 1 && (
            <nav aria-label={t('sermons.yearLabel')}>
              <ul className="flex flex-wrap gap-2">
                <li><Link to={yearHref(null)} className="filter-chip" aria-current={!year ? 'page' : undefined}>{t('sermons.allYears')}</Link></li>
                {years.data!.map((y) => (
                  <li key={y}><Link to={yearHref(y)} className="filter-chip" aria-current={year === y ? 'page' : undefined}>{y}</Link></li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </PageHeader>

      <div className="page-x mx-auto mt-6 max-w-page sm:mt-8">
        <div className="max-w-[52rem]">
          {list.isPending ? (
            <Loading lines={6} />
          ) : list.isError ? (
            <LoadError onRetry={() => void list.refetch()} />
          ) : items.length === 0 ? (
            <div className="ann-empty">
              <Empty>{filtered ? t('sermons.noMatch') : t('sermons.empty')}</Empty>
              {filtered && <Link to="/sermons" className="text-link">{t('sermons.showAll')}</Link>}
            </div>
          ) : (
            <>
              <p className="sr-only" aria-live="polite">{t('sermons.showing', { count: items.length })}</p>
              {groups.map((g) => (
                <section key={g.year} aria-labelledby={`tahun-${g.year}`} className="sermon-year">
                  <h2 id={`tahun-${g.year}`} className="archive-heading">
                    <span className="archive-mark" aria-hidden="true" />
                    {g.year}
                  </h2>
                  <ul className="sermon-list">
                    {g.items.map((s) => <SermonRow key={s.id} s={s} />)}
                  </ul>
                </section>
              ))}
              {list.hasNextPage && (
                <div className="mt-8">
                  <button type="button" className="btn btn--outline" aria-busy={list.isFetchingNextPage || undefined}
                    disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
                    {list.isFetchingNextPage && <span className="spinner" aria-hidden="true" />}
                    {t('sermons.loadMore')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function SermonRow({ s }: { s: SermonView }) {
  const { pick } = useLocalized();
  const fmt = useDates();
  const id = useId();
  const summary = s.summary ? excerpt(pick(s.summary), 150) : null;
  return (
    <li>
      <Link to={`/sermons/${s.slug}`} className="sermon-row" aria-labelledby={`${id}-t`} aria-describedby={`${id}-m`}>
        <YouTubeThumb id={s.youtube_video_id} className="sermon-row__thumb" />
        <span className="sermon-row__body">
          <span id={`${id}-m`} className="sermon-row__meta">
            <time dateTime={s.preached_on}>{fmt(s.preached_on)}</time>
            {s.preacher_name && <> · {s.preacher_name}</>}
          </span>
          <span id={`${id}-t`} className="sermon-row__title">{pick(s.title)}</span>
          {summary && <span className="sermon-row__excerpt">{summary}</span>}
          <Badges s={s} />
        </span>
        <Icon name="arrow-right-linear" className="sermon-row__arrow h-5 w-5" />
      </Link>
    </li>
  );
}

function Badges({ s }: { s: SermonView }) {
  const { t } = useTranslation();
  const list = [
    s.youtube_video_id && { icon: 'play-circle-linear', label: t('sermons.badgeVideo') },
    s.slides_url && { icon: 'document-text-linear', label: t('sermons.badgeSlides') },
    s.summary && { icon: 'book-2-linear', label: t('sermons.badgeSummary') },
  ].filter(Boolean) as { icon: string; label: string }[];
  if (!list.length) return null;
  return (
    <span className="sermon-badges">
      <span className="sr-only">{t('sermons.available')}: </span>
      {list.map((b, i) => (
        <span key={b.label} className="tag tag--accent tag--sm">
          <Icon name={b.icon} className="h-3.5 w-3.5" />
          {b.label}
          {i < list.length - 1 && <span className="sr-only">,</span>}
        </span>
      ))}
    </span>
  );
}

/** YouTube thumbnail (lazy) with a neutral placeholder when there is no video or it fails. */
function YouTubeThumb({ id, className = '', size = 'mqdefault' }: { id: string | null; className?: string; size?: 'mqdefault' | 'hqdefault' }) {
  const [failed, setFailed] = useState(false);
  if (!id || failed) {
    return (
      <span className={`yt-thumb yt-thumb--empty ${className}`} aria-hidden="true">
        <Icon name="document-text-linear" className="h-7 w-7" />
      </span>
    );
  }
  return (
    <span className={`yt-thumb ${className}`} aria-hidden="true">
      <img src={`https://i.ytimg.com/vi/${encodeURIComponent(id)}/${size}.jpg`} alt="" loading="lazy" decoding="async"
        width={320} height={180} onError={() => setFailed(true)} />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Detail                                                               */
/* ------------------------------------------------------------------ */

function SermonDetail({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const { pick } = useLocalized();
  const fmt = useDates();
  const q = useSermon(slug);
  const s = q.data;
  const neighbours = useSermonNeighbours(s);

  // Per-page title and description once the sermon is known (PageMeta sets
  // the generic ones first; this runs after it in the same commit).
  useEffect(() => {
    if (!s) return;
    const date = fmt(s.preached_on);
    document.title = t('meta.pageTitle', { page: pick(s.title) });
    const desc = s.summary
      ? excerpt(pick(s.summary), 155)
      : s.preacher_name ? t('sermons.metaDescBy', { date, preacher: s.preacher_name }) : t('sermons.metaDesc', { date });
    document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', desc);
    document.head.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', document.title);
    document.head.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute('content', desc);
  }, [s, t, pick, fmt]);

  const back = (
    <Link to="/sermons" className="text-link">
      <Icon name="arrow-left-linear" className="h-4 w-4" />
      {t('sermons.backToList')}
    </Link>
  );

  if (q.isPending || q.isError || !s) {
    return (
      <>
        <PageHeader eyebrow={t('sermons.eyebrow')} title={t('nav.sermons')}>{back}</PageHeader>
        <div className="page-x mx-auto mt-8 max-w-page">
          <div className="max-w-[52rem]">
            {q.isPending ? <Loading lines={6} /> : q.isError ? <LoadError onRetry={() => void q.refetch()} /> : <Empty>{t('sermons.notFound')}</Empty>}
          </div>
        </div>
      </>
    );
  }

  const title = pick(s.title);
  return (
    <>
      <PageHeader eyebrow={t('nav.sermons')} title={title}>
        <div className="flex flex-col gap-5">
          <dl className="sermon-facts">
            <div>
              <dt className="mini-label">{t('sermon.dateLabel')}</dt>
              <dd><time dateTime={s.preached_on}>{fmt(s.preached_on, true)}</time></dd>
            </div>
            {s.preacher_name && (
              <div>
                <dt className="mini-label">{t('sermon.preacherLabel')}</dt>
                <dd>{s.preacher_name}</dd>
              </div>
            )}
            {s.scripture_ref && (
              <div>
                <dt className="mini-label">{t('sermon.readingLabel')}</dt>
                <dd>{pick(s.scripture_ref)}</dd>
              </div>
            )}
          </dl>
          {back}
        </div>
      </PageHeader>

      <div className="page-x mx-auto mt-10 max-w-page">
        <div className="max-w-[52rem]">
          {s.youtube_video_id && <LiteYouTube id={s.youtube_video_id} title={title} />}
          {s.slides_url && <SlidesButton url={s.slides_url} />}
          {s.summary && (
            <section aria-labelledby="ringkasan" className="mt-10">
              <h2 id="ringkasan" className="archive-heading">
                <span className="archive-mark" aria-hidden="true" />
                {t('sermon.summaryLabel')}
              </h2>
              <Prose text={pick(s.summary)} className="mt-4 text-lg" />
            </section>
          )}
          <Neighbours older={neighbours.data?.older ?? null} newer={neighbours.data?.newer ?? null} />
        </div>
      </div>
    </>
  );
}

/** Thumbnail first; the youtube-nocookie iframe loads only after a click. */
function LiteYouTube({ id, title }: { id: string; title: string }) {
  const { t } = useTranslation();
  const [on, setOn] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => { if (on) frame.current?.focus(); }, [on]);
  return (
    <div className="lite-yt">
      {on ? (
        <iframe ref={frame} className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`}
          title={t('sermon.iframeTitle', { title })}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      ) : (
        <button type="button" className="lite-yt__button" onClick={() => setOn(true)} aria-label={t('sermons.play', { title })}>
          <img src={`https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" />
          <span className="lite-yt__play" aria-hidden="true"><Icon name="play-bold" className="h-8 w-8" /></span>
        </button>
      )}
    </div>
  );
}

function SlidesButton({ url }: { url: string }) {
  const { t } = useTranslation();
  const { lang } = useLocalized();
  const size = useFileSize(url);
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  const type = ext === 'pptx' ? 'PPTX' : ext === 'pdf' ? 'PDF' : (ext ?? '').toUpperCase();
  const bytes = size.data;
  const nf = (n: number, digits: number) => new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-GB', { maximumFractionDigits: digits }).format(n);
  const sizeText = bytes ? (bytes < 1024 * 1024 ? `${nf(Math.max(1, Math.round(bytes / 1024)), 0)} KB` : `${nf(bytes / 1024 / 1024, 1)} MB`) : null;
  const info = sizeText ? t('sermons.fileInfo', { type, size: sizeText }) : type;
  return (
    <div className="mt-8">
      <a href={url} className="btn btn--solid" target="_blank" rel="noopener noreferrer" download>
        <Icon name="download-minimalistic-linear" />
        {t('sermons.downloadSlides')}
        {info && <span className="font-normal opacity-80">({info})</span>}
        <span className="sr-only">{t('a11y.opensNewTab')}</span>
      </a>
    </div>
  );
}

function Neighbours({ older, newer }: { older: SermonLink | null; newer: SermonLink | null }) {
  const { t } = useTranslation();
  const { pick } = useLocalized();
  if (!older && !newer) return null;
  return (
    <nav aria-label={t('sermons.otherSermons')} className="sermon-pager">
      {older ? (
        <Link to={`/sermons/${older.slug}`} className="sermon-pager__link">
          <span className="mini-label"><Icon name="arrow-left-linear" className="h-4 w-4" /> {t('sermons.older')}</span>
          <span className="sermon-pager__title">{pick(older.title)}</span>
        </Link>
      ) : <span />}
      {newer && (
        <Link to={`/sermons/${newer.slug}`} className="sermon-pager__link sermon-pager__link--next">
          <span className="mini-label">{t('sermons.newer')} <Icon name="arrow-right-linear" className="h-4 w-4" /></span>
          <span className="sermon-pager__title">{pick(newer.title)}</span>
        </Link>
      )}
    </nav>
  );
}
