// frontend/lib/hooks/useRewardsTimeline.ts
import { useQuery } from '@tanstack/react-query';
import type { RewardsTimelineData } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface UseRewardsTimelineOptions {
  days?: number;
  refetchInterval?: number;
}

/**
 * Hook to fetch rewards timeline data for chart visualization.
 *
 * Fetches daily rewards claimed metrics with claim counts.
 * Used for RewardsTimelineChart component on the History page.
 *
 * @param options - Configuration options
 * @param options.days - Number of days to look back (default: 30, max: 90)
 * @param options.refetchInterval - Refetch interval in ms (default: 30000)
 *
 * @returns Query result with rewards timeline data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useRewardsTimeline({ days: 30 });
 *
 * if (data) {
 *   console.log(`Total rewards: ${data.total_rewards_dai} DAI`);
 *   console.log(`Total claims: ${data.total_claims}`);
 * }
 * ```
 */
export function useRewardsTimeline(options: UseRewardsTimelineOptions = {}) {
  const {
    days = 30,
    refetchInterval = 30000, // 30 seconds
  } = options;

  return useQuery<RewardsTimelineData>({
    queryKey: ['rewardsTimeline', days],
    queryFn: async () => {
      const params = new URLSearchParams({
        days: days.toString(),
      });

      const response = await fetch(
        `${API_URL}/api/analytics/rewards-timeline?${params}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch rewards timeline: ${response.statusText}`);
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
