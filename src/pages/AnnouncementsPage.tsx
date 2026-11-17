import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/PageHeader';
import { Prose } from '../components/Prose';
import { Icon } from '../components/Icon';
import { FeaturedCard } from '../components/FeaturedCard';
import { ArchiveList, ArchiveRow, ArchiveSection } from '../components/ArchiveSection';
import { Empty, Loading, LoadError } from '../components/QueryState';
import { useAnnouncements, useGroups } from '../data/queries';
import type { AnnouncementView } from '../data/types';
import { excerpt } from '../lib/markdown';
import { useLocalized } from '../lib/useLocalized';

const PAGE = 10;

function useFormats() {
  const { lang } = useLocalized();
  const loc = lang === 'id' ? 'id-ID' : 'en-GB';
  return {
    long: (iso: string) => new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(iso)),
    chip: (iso: string) => new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(iso)),
  };
}

/** /pengumuman (list) and /pengumuman/:id (detail). */
export function AnnouncementsPage() {
  const { id } = useParams<{ id?: string }>();
  return id ? <AnnouncementDetail id={id} /> : <AnnouncementList />;
}

function Eyebrow({ a }: { a: AnnouncementView }) {
  const { t } = useTranslation();
  const f = useFormats();
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {a.group && <span className="tag tag--accent">{a.group.name}</span>}
      <span className="featured-card__date">
        <span className="sr-only">{t('announcements.postedOn')} </span>
        <time dateTime={a.published_at}>{f.long(a.published_at)}</time>
      </span>
    </span>
  );
}

function Rows({ items, shown }: { items: AnnouncementView[]; shown: number }) {
  const { pick } = useLocalized();
  const f = useFormats();
  return (
    <ArchiveList>
      {items.slice(0, shown).map((a) => (
        <ArchiveRow
          key={a.id}
          to={`/pengumuman/${a.id}`}
          chip={f.chip(a.published_at)}
          chipDateTime={a.published_at}
          tag={a.group?.name}
          title={pick(a.title)}
          excerpt={excerpt(pick(a.body), 140)}
        />
      ))}
    </ArchiveList>
  );
}

function LoadMore({ shown, total, onMore }: { shown: number; total: number; onMore: () => void }) {
  const { t } = useTranslation();
  if (total <= shown) return null;
  return (
    <button type="button" className="btn btn--outline" onClick={onMore}>
      {t('dailyBread.loadMore')}
    </button>
  );
}

function AnnouncementList() {
  const { t } = useTranslation();
  const { pick } = useLocalized();
  const [params] = useSearchParams();
  const group = params.get('group');
  const groups = useGroups();
  const list = useAnnouncements(group);
  const [shown, setShown] = useState(PAGE);
  const [first, ...rest] = list.data ?? [];

  return (
    <>
      <PageHeader eyebrow={t('announcements.eyebrow')} title={t('nav.announcements')} intro={t('announcements.intro')}>
        <nav aria-label={t('announcements.filterLabel')}>
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link to="/pengumuman" className="filter-chip" aria-current={!group ? 'page' : undefined}>
                {t('announcements.all')}
              </Link>
            </li>
            {(groups.data ?? []).map((g) => (
              <li key={g.id}>
                <Link to={`/pengumuman?group=${encodeURIComponent(g.slug)}`} className="filter-chip" aria-current={group === g.slug ? 'page' : undefined}>
                  {g.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>

      <div className="page-x mx-auto mt-10 max-w-page">
        <div className="max-w-[52rem]">
          {list.isPending ? (
            <Loading lines={5} />
          ) : list.isError ? (
            <LoadError onRetry={() => void list.refetch()} />
          ) : !first ? (
            <Empty>{group ? t('announcements.emptyGroup') : t('announcements.empty')}</Empty>
          ) : (
            <FeaturedCard
              titleId="featured-title"
              eyebrow={<Eyebrow a={first} />}
              title={<Link to={`/pengumuman/${first.id}`} className="featured-card__title-link">{pick(first.title)}</Link>}
              media={first.image_url ? <img src={first.image_url} alt="" className="featured-card__image" decoding="async" /> : undefined}
              footer={
                <Link to={`/pengumuman/${first.id}`} className="text-link">
                  {t('announcements.readMore')}
                  <span className="sr-only">: {pick(first.title)}</span>
                  <Icon name="arrow-right-linear" className="h-4 w-4" />
                </Link>
              }
            >
              <p className="text-lg leading-relaxed text-stone-700">{excerpt(pick(first.body), 320)}</p>
            </FeaturedCard>
          )}
        </div>
      </div>

      {rest.length > 0 && (
        <ArchiveSection id="sebelumnya" title={t('announcements.earlier')}
          footer={<LoadMore shown={shown} total={rest.length} onMore={() => setShown((n) => n + PAGE)} />}>
          <Rows items={rest} shown={shown} />
        </ArchiveSection>
      )}
    </>
  );
}

function AnnouncementDetail({ id }: { id: string }) {
  const { t } = useTranslation();
  const { pick } = useLocalized();
  const list = useAnnouncements(null);
  const [shown, setShown] = useState(5);
  const item = list.data?.find((a) => a.id === id);
  const others = (list.data ?? []).filter((a) => a.id !== id);

  return (
    <>
      <PageHeader eyebrow={t('announcements.eyebrow')} title={t('nav.announcements')}>
        <Link to="/pengumuman" className="text-link">
          <Icon name="arrow-left-linear" className="h-4 w-4" />
          {t('announcements.backToAll')}
        </Link>
      </PageHeader>

      <div className="page-x mx-auto mt-8 max-w-page sm:mt-10">
        <div className="max-w-[52rem]">
          {list.isPending ? (
            <Loading lines={6} />
          ) : list.isError ? (
            <LoadError onRetry={() => void list.refetch()} />
          ) : !item ? (
            <Empty>{t('announcements.notFound')}</Empty>
          ) : (
            <FeaturedCard
              titleId="announcement-title"
              eyebrow={<Eyebrow a={item} />}
              title={pick(item.title)}
              media={item.image_url ? <img src={item.image_url} alt="" className="featured-card__image" decoding="async" /> : undefined}
            >
              <Prose text={pick(item.body)} className="text-lg" />
            </FeaturedCard>
          )}
        </div>
      </div>

      {others.length > 0 && (
        <ArchiveSection id="lainnya" title={t('announcements.others')}
          footer={<LoadMore shown={shown} total={others.length} onMore={() => setShown((n) => n + PAGE)} />}>
          <Rows items={others} shown={shown} />
        </ArchiveSection>
      )}
    </>
  );
}
