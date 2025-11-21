// frontend/lib/hooks/useActivityHeatmap.ts
import { useQuery } from '@tanstack/react-query';
import type { ActivityHeatmapData } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface UseActivityHeatmapOptions {
  days?: number;
  refetchInterval?: number;
}

/**
 * Hook to fetch activity heatmap data for visualization.
 *
 * Fetches hourly activity breakdown by event type (StakeCreated, RewardsClaimed, Unstaked).
 * Used for ActivityHeatmap component on the History page.
 *
 * @param options - Configuration options
 * @param options.days - Number of days to look back (default: 7, max: 30)
 * @param options.refetchInterval - Refetch interval in ms (default: 30000)
 *
 * @returns Query result with activity heatmap data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useActivityHeatmap({ days: 7 });
 *
 * if (data) {
 *   console.log(`Total events: ${data.total_events}`);
 *   console.log(`Days covered: ${data.days_covered}`);
 * }
 * ```
 */
export function useActivityHeatmap(options: UseActivityHeatmapOptions = {}) {
  const {
    days = 7,
    refetchInterval = 30000, // 30 seconds
  } = options;

  return useQuery<ActivityHeatmapData>({
    queryKey: ['activityHeatmap', days],
    queryFn: async () => {
      const params = new URLSearchParams({
        days: days.toString(),
      });

      const response = await fetch(
        `${API_URL}/api/analytics/activity-heatmap?${params}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch activity heatmap: ${response.statusText}`);
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
