import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { useOpenForm } from './forms/FormDialog';
import { Empty, Loading, LoadError } from './QueryState';
import { useNextWeeklyItem } from '../data/queries';
import { dayName } from '../data/churchInfo';
import type { ServiceView, WeeklyKind } from '../data/types';
import { useLocalized } from '../lib/useLocalized';
import { renderInline } from '../lib/markdown';

/** One church service (homepage carousel and the Church Services page). */
export function ServiceCard({ service, headingLevel = 'h3' }: { service: ServiceView; headingLevel?: 'h2' | 'h3' }) {
  const { t } = useTranslation();
  const { pick, lang, serviceTime } = useLocalized();
  const openForm = useOpenForm();
  const Heading = headingLevel;
  const days = [...new Set(service.times.map((x) => x.day))].map((d) => dayName(d, lang)).join(' · ');
  const icon = service.kind === 'sunday' ? 'calendar-linear'
    : service.weekly_kind === 'prayer_list' ? 'hand-heart-linear'
    : service.cta.type === 'form_choir' ? 'music-note-2-linear' : 'clock-circle-linear';
  const ctaLabel = service.cta.label ? pick(service.cta.label) : t('services.ctaDefault');

  let cta: ReactNode = null;
  if (service.cta.type === 'form_choir') {
    cta = (
      <button type="button" className="btn btn--solid" aria-haspopup="dialog" onClick={() => openForm('choir')}>
        <Icon name="users-group-rounded-linear" />
        {ctaLabel}
      </button>
    );
  } else if (service.cta.type === 'link' && service.cta.url) {
    const url = service.cta.url;
    cta = url.startsWith('/') ? (
      <Link to={url} className="btn btn--outline">{ctaLabel}<Icon name="arrow-right-linear" /></Link>
    ) : (
      <a href={url} className="btn btn--outline" {...(/^https?:/i.test(url) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {ctaLabel}
        <Icon name="arrow-right-up-linear" />
        {/^https?:/i.test(url) && <span className="sr-only">{t('a11y.opensNewTab')}</span>}
      </a>
    );
  }

  return (
    <article className="service-card">
      <div className="flex items-center justify-between gap-3">
        {days ? <span className="tag">{days}</span> : <span />}
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-stone-300" aria-hidden="true">
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
      <Heading className="mt-8 font-display text-[2rem] sm:text-[2.4rem]">{pick(service.name)}</Heading>
      <div className="mt-6 flex flex-1 flex-col">
        {service.times.length > 0 && (
          <div>
            <p className="mini-label">{t('services.timesLabel')}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {service.times.map((x) => (
                <li key={`${x.day}-${x.time}`} className="time-chip">
                  <Icon name="clock-circle-linear" className="h-4 w-4" />
                  {serviceTime(x)}
                  {x.label && <span className="time-chip__label">{pick(x.label)}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {service.description && (
          <p className={`text-lg leading-relaxed text-stone-700 ${service.times.length ? 'mt-5' : ''}`}>{pick(service.description)}</p>
        )}
        {service.weekly_kind && <WeeklyBlock kind={service.weekly_kind} />}
        {cta && <div className={service.weekly_kind ? 'pt-6' : 'mt-auto pt-8'}>{cta}</div>}
      </div>
    </article>
  );
}

/** "Next Sunday's material" / "This week's prayer list" inside a card. */
function WeeklyBlock({ kind }: { kind: WeeklyKind }) {
  const { t } = useTranslation();
  const { pick, formatDate } = useLocalized();
  const q = useNextWeeklyItem(kind);
  const list = kind === 'prayer_list';
  const label = list ? t('services.prayer.listLabel') : t('services.sunday.materialLabel');
  const emptyText = list ? t('services.prayer.listEmpty') : t('services.sunday.materialEmpty');
  return (
    <div className="card-block mt-auto">
      <p className="mini-label">{label}</p>
      {q.isPending ? (
        <Loading lines={3} className="mt-3" />
      ) : q.isError ? (
        <LoadError onRetry={() => void q.refetch()} className="mt-3" />
      ) : !q.data ? (
        <Empty className="mt-2">{emptyText}</Empty>
      ) : (
        <>
          <p className="mt-2 text-sm text-stone-600">
            <time dateTime={q.data.service_date}>{formatDate(q.data.service_date)}</time>
          </p>
          {list ? (
            <ul className="mt-3 space-y-2">
              {q.data.lines.map((item, i) => (
                <li key={i} className="flex gap-3 leading-snug">
                  <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-ink" aria-hidden="true" />
                  <span>{renderInline(pick(item))}</span>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <p className="mt-2 text-lg font-medium leading-snug">{pick(q.data.title)}</p>
              {q.data.lines.map((line, i) => (
                <p key={i} className="mt-2 flex items-center gap-2 text-sm text-stone-700">
                  <Icon name="book-2-linear" className="h-4 w-4 shrink-0" />
                  <span>{renderInline(pick(line))}</span>
                </p>
              ))}
            </>
          )}
          {q.data.file_url && (
            <a href={q.data.file_url} className="text-link mt-3" target="_blank" rel="noopener noreferrer">
              <Icon name="download-minimalistic-linear" className="h-4 w-4" />
              {pick(q.data.title)}
            </a>
          )}
        </>
      )}
    </div>
  );
}
