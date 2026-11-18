// TanStack Query hooks: the ONLY way components get data.
import { useInfiniteQuery, useQuery, type QueryClient } from '@tanstack/react-query';
import { getFileSize, getLatestSermon, getSermonBySlug, getSermonNeighbours, listSermonYears, listSermons } from './sermons';
import { getNextWeeklyItem } from './weekly';
import { getCurrentDailyBread, getDailyBreadByDate, listDailyBread, listDailyBreadDates } from './dailyBread';
import { getAnnouncement, listAnnouncementWeeks, listAnnouncementsForWeek, listGroups } from './announcements';
import { getRoster } from './roster';
import { listServices } from './services';
import { FALLBACK_SERVICES } from './churchInfo';
import type { WeeklyKind } from './types';

// Keys never contain "today": the prerendered cache must match on hydration.
export const queryKeys = {
  latestSermon: ['sermons', 'latest'] as const,
  sermonList: (q: string, year: number | null) => ['sermons', 'list', q, year] as const,
  sermonYears: ['sermons', 'years'] as const,
  sermon: (slug: string) => ['sermons', 'item', slug] as const,
  sermonNeighbours: (id: string) => ['sermons', 'neighbours', id] as const,
  nextWeekly: (kind: WeeklyKind) => ['weekly', 'next', kind] as const,
  dailyBreadCurrent: ['daily-bread', 'current'] as const,
  dailyBreadByDate: (date: string) => ['daily-bread', 'date', date] as const,
  dailyBreadArchive: ['daily-bread', 'archive'] as const,
  dailyBreadDates: ['daily-bread', 'dates'] as const,
  groups: ['groups'] as const,
  announcementWeeks: ['announcements', 'weeks'] as const,
  announcementsWeek: (week: string) => ['announcements', 'week', week] as const,
  announcement: (id: string) => ['announcements', 'item', id] as const,
  roster: (weekStart: string) => ['roster', weekStart] as const,
  services: ['services'] as const,
};

/** Homepage data, fetched at build time for the static HTML. Returns how many failed. */
export async function prefetchHomepage(client: QueryClient): Promise<number> {
  const results = await Promise.allSettled([
    client.fetchQuery({ queryKey: queryKeys.latestSermon, queryFn: getLatestSermon, retry: 1 }),
    client.fetchQuery({ queryKey: queryKeys.nextWeekly('sunday_material'), queryFn: () => getNextWeeklyItem('sunday_material'), retry: 1 }),
    client.fetchQuery({ queryKey: queryKeys.nextWeekly('prayer_list'), queryFn: () => getNextWeeklyItem('prayer_list'), retry: 1 }),
    prefetchServices(client),
  ]);
  return results.filter((r) => r.status === 'rejected').length;
}

/** Services are shown in the footer of every page, so every pre-rendered page gets them. */
export function prefetchServices(client: QueryClient) {
  return client.fetchQuery({ queryKey: queryKeys.services, queryFn: listServices, retry: 1 });
}

/** Raw query (loading / error states) for pages that list services. */
export const useServices = () => useQuery({ queryKey: queryKeys.services, queryFn: listServices });

/**
 * Services with the offline fallback: the stored copy in churchInfo.ts is
 * shown while loading or if the request fails, so times are never blank.
 */
export function useServiceList() {
  const q = useServices();
  return { services: q.data ?? FALLBACK_SERVICES, isFallback: !q.data, isPending: q.isPending, isError: q.isError };
}

/** Times of the fixed Sunday service (fallback while loading). */
export function useSundayTimes() {
  const { services } = useServiceList();
  return (services.find((s) => s.kind === 'sunday') ?? FALLBACK_SERVICES[0]).times;
}

export const useLatestSermon = () => useQuery({ queryKey: queryKeys.latestSermon, queryFn: getLatestSermon });

/** /sermons list: pages of 10 ("Muat lebih banyak"), filtered by search and year. */
export const useSermonList = (q: string, year: number | null) =>
  useInfiniteQuery({
    queryKey: queryKeys.sermonList(q, year),
    queryFn: ({ pageParam }) => listSermons({ q, year, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.hasMore ? all.length : undefined),
  });

export const useSermonYears = () => useQuery({ queryKey: queryKeys.sermonYears, queryFn: listSermonYears, staleTime: 10 * 60_000 });

export const useSermon = (slug: string) => useQuery({ queryKey: queryKeys.sermon(slug), queryFn: () => getSermonBySlug(slug) });

export const useSermonNeighbours = (s: { id: string; preached_on: string } | null | undefined) =>
  useQuery({ queryKey: queryKeys.sermonNeighbours(s?.id ?? ''), queryFn: () => getSermonNeighbours(s!), enabled: Boolean(s) });

/** Byte size of a public file (slides), via a HEAD request. */
export const useFileSize = (url: string | null) =>
  useQuery({ queryKey: ['file-size', url], queryFn: () => getFileSize(url!), enabled: Boolean(url), staleTime: Infinity, retry: false });

export const useNextWeeklyItem = (kind: WeeklyKind) =>
  useQuery({ queryKey: queryKeys.nextWeekly(kind), queryFn: () => getNextWeeklyItem(kind) });

export const useCurrentDailyBread = () =>
  useQuery({ queryKey: queryKeys.dailyBreadCurrent, queryFn: getCurrentDailyBread });

export const useDailyBreadByDate = (date: string, enabled = true) =>
  useQuery({ queryKey: queryKeys.dailyBreadByDate(date), queryFn: () => getDailyBreadByDate(date), enabled });

export const useDailyBreadArchive = () =>
  useQuery({ queryKey: queryKeys.dailyBreadArchive, queryFn: () => listDailyBread() });

/** Published dates only (calendar dots and week bounds). */
export const useDailyBreadDates = () =>
  useQuery({ queryKey: queryKeys.dailyBreadDates, queryFn: listDailyBreadDates, staleTime: 5 * 60_000 });

export const useGroups = () => useQuery({ queryKey: queryKeys.groups, queryFn: listGroups, staleTime: 10 * 60_000 });

/** Week-start Sundays that have published announcements (navigator bounds). */
export const useAnnouncementWeeks = () =>
  useQuery({ queryKey: queryKeys.announcementWeeks, queryFn: listAnnouncementWeeks });

export const useAnnouncementsForWeek = (week: string) =>
  useQuery({ queryKey: queryKeys.announcementsWeek(week), queryFn: () => listAnnouncementsForWeek(week) });

export const useAnnouncement = (id: string) =>
  useQuery({ queryKey: queryKeys.announcement(id), queryFn: () => getAnnouncement(id) });

export const useRoster = (weekStart: string) =>
  useQuery({ queryKey: queryKeys.roster(weekStart), queryFn: () => getRoster(weekStart) });
