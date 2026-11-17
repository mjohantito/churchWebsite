// TanStack Query hooks: the ONLY way components get data.
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { getLatestSermon } from './sermons';
import { getNextWeeklyItem } from './weekly';
import { getCurrentDailyBread, getDailyBreadByDate, listDailyBread } from './dailyBread';
import { listAnnouncements, listGroups } from './announcements';
import { getRoster } from './roster';
import type { WeeklyKind } from './types';

// Keys never contain "today": the prerendered cache must match on hydration.
export const queryKeys = {
  latestSermon: ['sermons', 'latest'] as const,
  nextWeekly: (kind: WeeklyKind) => ['weekly', 'next', kind] as const,
  dailyBreadCurrent: ['daily-bread', 'current'] as const,
  dailyBreadByDate: (date: string) => ['daily-bread', 'date', date] as const,
  dailyBreadArchive: ['daily-bread', 'archive'] as const,
  groups: ['groups'] as const,
  announcements: (group: string | null) => ['announcements', group ?? 'all'] as const,
  roster: (weekStart: string) => ['roster', weekStart] as const,
};

/** Homepage data, fetched at build time for the static HTML. Returns how many failed. */
export async function prefetchHomepage(client: QueryClient): Promise<number> {
  const results = await Promise.allSettled([
    client.fetchQuery({ queryKey: queryKeys.latestSermon, queryFn: getLatestSermon, retry: 1 }),
    client.fetchQuery({ queryKey: queryKeys.nextWeekly('sunday_material'), queryFn: () => getNextWeeklyItem('sunday_material'), retry: 1 }),
    client.fetchQuery({ queryKey: queryKeys.nextWeekly('prayer_list'), queryFn: () => getNextWeeklyItem('prayer_list'), retry: 1 }),
  ]);
  return results.filter((r) => r.status === 'rejected').length;
}

export const useLatestSermon = () => useQuery({ queryKey: queryKeys.latestSermon, queryFn: getLatestSermon });

export const useNextWeeklyItem = (kind: WeeklyKind) =>
  useQuery({ queryKey: queryKeys.nextWeekly(kind), queryFn: () => getNextWeeklyItem(kind) });

export const useCurrentDailyBread = () =>
  useQuery({ queryKey: queryKeys.dailyBreadCurrent, queryFn: getCurrentDailyBread });

export const useDailyBreadByDate = (date: string, enabled = true) =>
  useQuery({ queryKey: queryKeys.dailyBreadByDate(date), queryFn: () => getDailyBreadByDate(date), enabled });

export const useDailyBreadArchive = () =>
  useQuery({ queryKey: queryKeys.dailyBreadArchive, queryFn: () => listDailyBread() });

export const useGroups = () => useQuery({ queryKey: queryKeys.groups, queryFn: listGroups, staleTime: 10 * 60_000 });

export const useAnnouncements = (group: string | null) =>
  useQuery({ queryKey: queryKeys.announcements(group), queryFn: () => listAnnouncements(group) });

export const useRoster = (weekStart: string) =>
  useQuery({ queryKey: queryKeys.roster(weekStart), queryFn: () => getRoster(weekStart) });
