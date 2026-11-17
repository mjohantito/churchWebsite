import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/PageHeader';
import { Prose } from '../components/Prose';
import { Empty, Loading, LoadError } from '../components/QueryState';
import { useAnnouncements, useGroups } from '../data/queries';
import { useLocalized } from '../lib/useLocalized';

export function AnnouncementsPage() {
  const { t } = useTranslation();
  const { pick, lang } = useLocalized();
  const [params] = useSearchParams();
  const group = params.get('group');
  const groups = useGroups();
  const list = useAnnouncements(group);
  const formatPosted = (iso: string) =>
    new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(iso));

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
                <Link
                  to={`/pengumuman?group=${encodeURIComponent(g.slug)}`}
                  className="filter-chip"
                  aria-current={group === g.slug ? 'page' : undefined}
                >
                  {g.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>

      <div className="page-x mx-auto mt-14 max-w-page">
        {list.isPending ? (
          <Loading lines={5} className="max-w-2xl" />
        ) : list.isError ? (
          <LoadError onRetry={() => void list.refetch()} />
        ) : list.data.length === 0 ? (
          <Empty>{group ? t('announcements.emptyGroup') : t('announcements.empty')}</Empty>
        ) : (
          <ol className="divide-y divide-stone-200 border-y border-stone-200">
            {list.data.map((a) => (
              <li key={a.id} className="grid gap-6 py-10 md:grid-cols-12">
                <div className="md:col-span-3">
                  {a.group && <span className="tag">{a.group.name}</span>}
                  <p className="mt-3 text-sm text-stone-600">
                    {t('announcements.postedOn')}{' '}
                    <time dateTime={a.published_at}>{formatPosted(a.published_at)}</time>
                  </p>
                </div>
                <article className="md:col-span-9" aria-labelledby={`a-${a.id}`}>
                  <h2 id={`a-${a.id}`} className="font-label text-[1.4rem] leading-[1.15] sm:text-[1.6rem]">
                    {pick(a.title)}
                  </h2>
                  {a.image_url && (
                    <img src={a.image_url} alt="" loading="lazy" decoding="async"
                      className="mt-5 aspect-[16/9] w-full max-w-2xl rounded-[1.25rem] object-cover" />
                  )}
                  <Prose text={pick(a.body)} className="mt-4 max-w-[40rem]" />
                </article>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
