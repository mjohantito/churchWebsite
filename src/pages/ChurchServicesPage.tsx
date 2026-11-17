import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/PageHeader';
import { ServiceCard } from '../components/ServiceCard';
import { Icon } from '../components/Icon';
import { Empty } from '../components/QueryState';
import { useServiceList } from '../data/queries';
import { CHURCH_INFO, MAPS_URL } from '../data/churchInfo';

/** /church-services: every visible service (managed in /admin/services). */
export function ChurchServicesPage() {
  const { t } = useTranslation();
  const { services } = useServiceList(); // offline copy while loading / on error
  return (
    <>
      <PageHeader eyebrow={t('churchServices.eyebrow')} title={t('nav.services')} intro={t('churchServices.intro')} />
      <div className="page-x mx-auto mt-12 max-w-page">
        {services.length === 0 ? (
          <Empty>{t('churchServices.empty')}</Empty>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map((s) => (
              <li key={s.id} className="flex">
                <ServiceCard service={s} headingLevel="h2" />
              </li>
            ))}
          </ul>
        )}
        <section aria-labelledby="location-heading" className="mt-16 max-w-xl">
          <h2 id="location-heading" className="mini-label">{t('churchServices.location')}</h2>
          <address className="mt-3 text-lg not-italic leading-relaxed text-stone-700">{CHURCH_INFO.address}</address>
          <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="text-link mt-2">
            <Icon name="map-point-linear" className="h-5 w-5" />
            {t('footer.maps')}
            <span className="sr-only">{t('a11y.opensNewTab')}</span>
          </a>
        </section>
      </div>
    </>
  );
}
