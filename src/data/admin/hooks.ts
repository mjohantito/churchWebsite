// TanStack Query hooks for the admin page. Every mutation invalidates the
// admin lists AND the matching public queries, so the public pages update.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteContent, findConflict, getContent, listContent, saveContent,
  type ContentTable, type Input, type Row,
} from './content';
import { deleteSubmission, getSubmission, inboxSummary, listSubmissions, updateSubmission, type InboxFilter, type SubmissionStatus } from './inbox';
import { getRosterCells, listRoles, saveRole, saveRosterCells, type DutyRole, type RosterCells } from './roster';
import { listAllGroups, saveGroup, type Group } from './groups';
import { listStaff } from './staff';
import { deleteService, getService, listAllServices, saveService, swapServiceOrder, updateServiceFlags, type ServiceInput, type TimeInput } from './services';

/** Public query keys (src/data/queries.ts) affected by each admin table. */
const PUBLIC_KEYS: Record<ContentTable | 'groups' | 'roster' | 'services', string[][]> = {
  daily_bread: [['daily-bread']],
  sermons: [['sermons']],
  weekly_items: [['weekly']],
  announcements: [['announcements']],
  groups: [['groups'], ['announcements']],
  roster: [['roster']],
  services: [['services']],
};

export const adminKeys = {
  content: (table: ContentTable, filter?: Record<string, string>) => ['admin', table, 'list', filter ?? {}] as const,
  item: (table: ContentTable, id: string) => ['admin', table, 'item', id] as const,
  conflict: (table: ContentTable, match: Record<string, string>, exceptId: string | null) => ['admin', table, 'conflict', match, exceptId] as const,
  inbox: (filter: InboxFilter) => ['admin', 'inbox', 'list', filter] as const,
  submission: (id: string) => ['admin', 'inbox', 'item', id] as const,
  summary: ['admin', 'inbox', 'summary'] as const,
  roles: (all: boolean) => ['admin', 'roles', all] as const,
  roster: (week: string) => ['admin', 'roster', week] as const,
  groups: ['admin', 'groups'] as const,
  staff: ['admin', 'staff'] as const,
  services: ['admin', 'services', 'list'] as const,
  service: (id: string) => ['admin', 'services', 'item', id] as const,
};

function useInvalidate() {
  const qc = useQueryClient();
  return (adminPrefix: string, publicKeys: string[][] = []) =>
    Promise.all([qc.invalidateQueries({ queryKey: ['admin', adminPrefix] }), ...publicKeys.map((k) => qc.invalidateQueries({ queryKey: k }))]);
}

/* ---------------- content ---------------- */

export const useContentList = <T extends ContentTable>(table: T, filter?: Record<string, string>) =>
  useQuery({ queryKey: adminKeys.content(table, filter), queryFn: () => listContent(table, filter) });

export const useContentItem = <T extends ContentTable>(table: T, id: string | null) =>
  useQuery({ queryKey: adminKeys.item(table, id ?? 'new'), queryFn: () => getContent(table, id!), enabled: Boolean(id), staleTime: 0 });

/** Id of another row with the same unique key, or null. */
export const useConflict = (table: ContentTable, match: Record<string, string> | null, exceptId: string | null) =>
  useQuery({
    queryKey: adminKeys.conflict(table, match ?? {}, exceptId),
    queryFn: () => findConflict(table, match!, exceptId),
    enabled: Boolean(match && Object.values(match).every(Boolean)),
    staleTime: 0,
  });

export function useSaveContent<T extends ContentTable>(table: T) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: Input<T> }) => saveContent(table, id, input),
    onSuccess: () => invalidate(table, PUBLIC_KEYS[table]),
  });
}

export function useDeleteContent<T extends ContentTable>(table: T) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (row: Row<T>) => deleteContent(table, row),
    onSuccess: () => invalidate(table, PUBLIC_KEYS[table]),
  });
}

/* ---------------- inbox ---------------- */

export const useInbox = (filter: InboxFilter) => useQuery({ queryKey: adminKeys.inbox(filter), queryFn: () => listSubmissions(filter) });
export const useSubmission = (id: string) => useQuery({ queryKey: adminKeys.submission(id), queryFn: () => getSubmission(id), staleTime: 0 });
export const useInboxSummary = () => useQuery({ queryKey: adminKeys.summary, queryFn: inboxSummary, staleTime: 30_000 });

export function useUpdateSubmission() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { status?: SubmissionStatus; staff_notes?: string | null } }) => updateSubmission(id, patch),
    onSuccess: () => invalidate('inbox'),
  });
}

export function useDeleteSubmission() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: deleteSubmission, onSuccess: () => invalidate('inbox') });
}

/* ---------------- roster ---------------- */

export const useRoles = (includeInactive: boolean) =>
  useQuery({ queryKey: adminKeys.roles(includeInactive), queryFn: () => listRoles(includeInactive) });
export const useRosterCells = (week: string) => useQuery({ queryKey: adminKeys.roster(week), queryFn: () => getRosterCells(week), staleTime: 0 });

export function useSaveRoster() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ week, cells, before }: { week: string; cells: RosterCells; before: RosterCells }) => saveRosterCells(week, cells, before),
    onSuccess: () => invalidate('roster', PUBLIC_KEYS.roster),
  });
}

export function useSaveRole() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: Pick<DutyRole, 'name_id' | 'name_en' | 'sort_order' | 'active'> }) => saveRole(id, input),
    onSuccess: () => Promise.all([invalidate('roles'), invalidate('roster', PUBLIC_KEYS.roster)]),
  });
}

/* ---------------- groups / staff ---------------- */

export const useAllGroups = () => useQuery({ queryKey: adminKeys.groups, queryFn: listAllGroups });

export function useSaveGroup() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: Pick<Group, 'name' | 'sort_order' | 'active'> }) => saveGroup(id, input),
    onSuccess: () => invalidate('groups', PUBLIC_KEYS.groups),
  });
}

export const useStaffList = () => useQuery({ queryKey: adminKeys.staff, queryFn: listStaff });

/* ---------------- church services ---------------- */

export const useAdminServices = () => useQuery({ queryKey: adminKeys.services, queryFn: listAllServices });
export const useAdminService = (id: string | null) =>
  useQuery({ queryKey: adminKeys.service(id ?? 'new'), queryFn: () => getService(id!), enabled: Boolean(id), staleTime: 0 });

export function useSaveService() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, service, times }: { id: string | null; service: ServiceInput; times: TimeInput[] }) => saveService(id, service, times),
    onSuccess: () => invalidate('services', PUBLIC_KEYS.services),
  });
}

export function useUpdateServiceFlags() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateServiceFlags>[1] }) => updateServiceFlags(id, patch),
    onSuccess: () => invalidate('services', PUBLIC_KEYS.services),
  });
}

export function useSwapServices() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { a: { id: string }; aIndex: number; b: { id: string }; bIndex: number }) => swapServiceOrder(v.a, v.aIndex, v.b, v.bIndex),
    onSettled: () => invalidate('services', PUBLIC_KEYS.services),
  });
}

export function useDeleteService() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: deleteService, onSuccess: () => invalidate('services', PUBLIC_KEYS.services) });
}
