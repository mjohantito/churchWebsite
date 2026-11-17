import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Empty, Loading, LoadError } from '../../components/QueryState';
import { Icon } from '../../components/Icon';
import { useAdminServices, useSwapServices, useUpdateServiceFlags } from '../../data/admin/hooks';
import type { ServiceWithTimes } from '../../data/admin/services';
import { formatServiceTime } from '../../data/churchInfo';
import { useLocalized } from '../../lib/useLocalized';
import { ButtonLink, PageHead, Switch } from '../ui';
import { useToast } from '../Toast';
import { useAdminError } from '../useAdminError';

/** /admin/services: order, visibility and homepage toggles. */
export default function Services() {
  const { t } = useTranslation();
  const list = useAdminServices();
  const swap = useSwapServices();
  const onError = useAdminError();
  const rows = list.data ?? [];

  const move = (i: number, dir: -1 | 1) => {
    const a = rows[i];
    const b = rows[i + dir];
    if (!a || !b) return;
    swap.mutate({ a, aIndex: i, b, bIndex: i + dir }, { onError });
  };

  return (
    <>
      <PageHead title={t('admin.nav.services')}
        actions={<ButtonLink to="/admin/services/new" variant="primary" icon="add-circle-linear">{t('admin.services.new')}</ButtonLink>}>
        {t('admin.services.hint')}
      </PageHead>
      {list.isPending ? (
        <Loading lines={5} className="max-w-xl" />
      ) : list.isError ? (
        <LoadError onRetry={() => void list.refetch()} />
      ) : rows.length === 0 ? (
        <Empty>{t('admin.common.empty')}</Empty>
      ) : (
        <ol className="space-y-3" aria-label={t('admin.services.order')}>
          {rows.map((s, i) => (
            <ServiceRow key={s.id} s={s} first={i === 0} last={i === rows.length - 1} busy={swap.isPending} onMove={(d) => move(i, d)} />
          ))}
        </ol>
      )}
    </>
  );
}

function ServiceRow({ s, first, last, busy, onMove }: { s: ServiceWithTimes; first: boolean; last: boolean; busy: boolean; onMove: (d: -1 | 1) => void }) {
  const { t } = useTranslation();
  const { lang } = useLocalized();
  const toast = useToast();
  const onError = useAdminError();
  const flags = useUpdateServiceFlags();
  const name = lang === 'en' && s.name_en ? s.name_en : s.name_id;
  const times = s.church_service_times.map((x) => formatServiceTime({ day: x.day_of_week, time: x.start_time.slice(0, 5) }, lang));

  const toggle = (patch: { visible?: boolean; show_on_homepage?: boolean }) =>
    flags.mutate({ id: s.id, patch }, { onSuccess: () => toast.success(t('admin.toast.saved')), onError });

  return (
    <li className={`service-row ${s.visible ? '' : 'is-hidden'}`}>
      <div className="flex flex-col gap-1">
        <button type="button" className="icon-button" aria-label={`${t('admin.common.moveUp')}: ${name}`} disabled={first || busy} onClick={() => onMove(-1)}>
          <Icon name="arrow-up-linear" className="h-5 w-5" />
        </button>
        <button type="button" className="icon-button" aria-label={`${t('admin.common.moveDown')}: ${name}`} disabled={last || busy} onClick={() => onMove(1)}>
          <Icon name="arrow-down-linear" className="h-5 w-5" />
        </button>
      </div>

      <div className="min-w-0 flex-1 basis-56">
        <p className="flex flex-wrap items-center gap-2 text-lg font-bold">
          {s.is_fixed && <Icon name="lock-keyhole-linear" className="h-5 w-5 text-accent-strong" />}
          {name}
          {!s.visible && <span className="badge badge--muted">{t('admin.services.hidden')}</span>}
        </p>
        <p className="mt-1 text-sm text-stone-600">{times.length ? times.join(' · ') : t('admin.services.noTimes')}</p>
        {s.is_fixed && <p className="lock-note mt-2">{t('admin.services.fixedNote')}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Switch checked={s.visible} label={t('admin.services.visible')} disabled={flags.isPending} onChange={(v) => toggle({ visible: v })} />
        <Switch checked={s.show_on_homepage} label={t('admin.services.onHomepage')} disabled={flags.isPending} onChange={(v) => toggle({ show_on_homepage: v })} />
        <Link to={`/admin/services/${s.id}`} className="abtn abtn--secondary">
          <Icon name="pen-2-linear" className="h-5 w-5" />
          {t('admin.common.edit')}
          <span className="sr-only">: {name}</span>
        </Link>
      </div>
    </li>
  );
}
