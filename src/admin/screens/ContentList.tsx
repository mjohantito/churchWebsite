import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Empty, Loading, LoadError } from '../../components/QueryState';
import { Icon } from '../../components/Icon';
import { useContentList } from '../../data/admin/hooks';
import type { ContentTable, Row } from '../../data/admin/content';
import { ButtonLink, PageHead, StatusBadge } from '../ui';

interface Props<T extends ContentTable> {
  table: T;
  title: string;
  basePath: string;
  newLabel: string;
  filter?: Record<string, string>;
  filters?: ReactNode;
  /** what each row shows */
  describe: (row: Row<T>) => { primary: string; secondary?: string; meta: string };
}

/** List of one content type: table on wide screens, cards on phones. */
export function ContentList<T extends ContentTable>({ table, title, basePath, newLabel, filter, filters, describe }: Props<T>) {
  const { t } = useTranslation();
  const list = useContentList(table, filter);
  return (
    <>
      <PageHead title={title} actions={<ButtonLink to={`${basePath}/new`} variant="primary" icon="user-plus-rounded-linear">{newLabel}</ButtonLink>} />
      {filters && <div className="mb-5">{filters}</div>}
      {list.isPending ? (
        <Loading lines={5} className="max-w-xl" />
      ) : list.isError ? (
        <LoadError onRetry={() => void list.refetch()} />
      ) : list.data.length === 0 ? (
        <Empty>{t('admin.common.empty')}</Empty>
      ) : (
        <ul className="admin-list">
          {list.data.map((row) => {
            const d = describe(row);
            const r = row as { id: string; status: 'draft' | 'published' };
            return (
              <li key={r.id}>
                <Link to={`${basePath}/${r.id}`} className="admin-list__item">
                  <span className="admin-list__meta">{d.meta}</span>
                  <span className="admin-list__main">
                    <span className="font-medium">{d.primary}</span>
                    {d.secondary && <span className="text-sm text-stone-600">{d.secondary}</span>}
                  </span>
                  <StatusBadge status={r.status} />
                  <Icon name="arrow-right-linear" className="hidden h-5 w-5 sm:block" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
