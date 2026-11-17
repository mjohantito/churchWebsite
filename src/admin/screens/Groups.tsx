import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loading, LoadError } from '../../components/QueryState';
import { useAllGroups, useSaveGroup } from '../../data/admin/hooks';
import type { Group } from '../../data/admin/groups';
import { slugify } from '../../data/admin/groups';
import { Button, Card, PageHead, TextField } from '../ui';
import { useToast } from '../Toast';
import { useAdminError } from '../useAdminError';
import { NameRow } from './Roster';

/** Admin: announcement groups. Never deleted (announcements keep their group). */
export default function Groups() {
  const { t } = useTranslation();
  const groups = useAllGroups();
  const save = useSaveGroup();
  const toast = useToast();
  const onError = useAdminError();
  const [name, setName] = useState('');
  const list = groups.data ?? [];

  const persist = async (id: string | null, input: Pick<Group, 'name' | 'sort_order' | 'active'>) => {
    try {
      await save.mutateAsync({ id, input });
      toast.success(t('admin.toast.saved'));
      return true;
    } catch (err) {
      onError(err);
      return false;
    }
  };
  const move = async (i: number, dir: -1 | 1) => {
    const a = list[i];
    const b = list[i + dir];
    if (!a || !b) return;
    await persist(a.id, { ...a, sort_order: i + dir + 1 });
    await persist(b.id, { ...b, sort_order: i + 1 });
  };

  return (
    <>
      <PageHead title={t('admin.nav.groups')}>{t('admin.groups.hint')}</PageHead>
      <Card>
        {groups.isPending ? <Loading lines={4} /> : groups.isError ? <LoadError onRetry={() => void groups.refetch()} /> : (
          <ul className="space-y-3">
            {list.map((g, i) => (
              <NameRow key={g.id} idValue={g.name} active={g.active} first={i === 0} last={i === list.length - 1} busy={save.isPending}
                idLabel={t('admin.groups.name')} enLabel={null} extra={`${t('admin.groups.slug')}: ${g.slug}`}
                onSave={(n) => persist(g.id, { ...g, name: n })}
                onToggle={() => void persist(g.id, { ...g, active: !g.active })}
                onMove={(d) => void move(i, d)} />
            ))}
          </ul>
        )}
        <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end" onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          if (await persist(null, { name: name.trim(), sort_order: list.length + 1, active: true })) setName('');
        }}>
          <TextField label={t('admin.groups.name')} required value={name} onChange={setName} maxLength={120}
            hint={name.trim() ? `${t('admin.groups.slug')}: ${slugify(name)} · ${t('admin.groups.slugHint')}` : t('admin.groups.slugHint')} />
          <Button type="submit" variant="primary" disabled={!name.trim()} busy={save.isPending}>{t('admin.groups.add')}</Button>
        </form>
      </Card>
    </>
  );
}
