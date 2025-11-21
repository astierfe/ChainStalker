// frontend/lib/hooks/useTopStakers.ts
import { useQuery } from '@tanstack/react-query';
import type { TopStakersData } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface UseTopStakersOptions {
  limit?: number;
  refetchInterval?: number;
}

/**
 * Hook to fetch top stakers for dashboard or leaderboard display.
 *
 * Fetches the latest snapshot of top stakers from the metrics collection.
 * Data is updated every 15 minutes by the Celery task `snapshot_top_users()`.
 *
 * @param options - Configuration options
 * @param options.limit - Number of stakers to fetch (default: 3, max: 100)
 * @param options.refetchInterval - Refetch interval in ms (default: 30000)
 *
 * @returns Query result with top stakers data
 *
 * @example
 * ```tsx
 * // Compact display (3 stakers)
 * const { data } = useTopStakers({ limit: 3 });
 *
 * // Full leaderboard (20 stakers)
 * const { data } = useTopStakers({ limit: 20 });
 * ```
 */
export function useTopStakers(options: UseTopStakersOptions = {}) {
  const {
    limit = 3,
    refetchInterval = 30000, // 30 seconds
  } = options;

  return useQuery<TopStakersData>({
    queryKey: ['topStakers', limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      const response = await fetch(
        `${API_URL}/api/analytics/top-stakers?${params}`
      );

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
