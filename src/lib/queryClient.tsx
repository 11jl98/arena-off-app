import { QueryClient } from '@tanstack/react-query';
import { CACHE_TIME } from '@/utils/constants/cache.constant';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: CACHE_TIME.DEFAULT,
    },
  },
});
