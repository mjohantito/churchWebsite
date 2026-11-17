import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { NavKey } from '../config/site';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';

export function ComingSoon({ titleKey }: { titleKey: NavKey }) {
  const { t } = useTranslation();
  return (
    <PageHeader eyebrow={t('comingSoon.eyebrow')} title={t(titleKey)} intro={t('comingSoon.body')}>
      <Link to="/" className="btn btn--outline">
        <Icon name="arrow-left-linear" />
        {t('comingSoon.back')}
      </Link>
    </PageHeader>
  );
}
