import { QueryClient } from '@tanstack/react-query';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000, // weekly church content: one minute is plenty fresh
        gcTime: 10 * 60_000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/** Key under which the build-time prerender stores dehydrated query data. */
export const DEHYDRATED_KEY = '__SB_QUERY_STATE__';
