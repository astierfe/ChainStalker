// frontend/lib/hooks/useTopStakers.ts
import { useQuery } from '@tanstack/react-query';
import type { TopStakersData } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface UseTopStakersOptions {
  refetchInterval?: number;
}

/**
 * Hook to fetch top 3 stakers for compact dashboard display.
 *
 * Fetches the latest snapshot of top stakers from the metrics collection.
 * Data is updated every 15 minutes by the Celery task `snapshot_top_users()`.
 *
 * @param options - Configuration options
 * @param options.refetchInterval - Refetch interval in ms (default: 30000)
 *
 * @returns Query result with top 3 stakers data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTopStakers();
 *
 * if (data && data.stakers.length > 0) {
 *   console.log(`#1: ${data.stakers[0].address} - ${data.stakers[0].total_staked_formatted}`);
 * }
 * ```
 */
export function useTopStakers(options: UseTopStakersOptions = {}) {
  const {
    refetchInterval = 30000, // 30 seconds
  } = options;

  return useQuery<TopStakersData>({
    queryKey: ['topStakers'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/analytics/top-stakers`);

      if (!response.ok) {
        throw new Error(`Failed to fetch top stakers: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    },
    refetchInterval,
    staleTime: 20000, // Consider data stale after 20 seconds
    retry: 2,
    retryDelay: 1000,
  });
}
