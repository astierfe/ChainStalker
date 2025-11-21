// frontend/lib/hooks/useTVLHistory.ts
import { useQuery } from '@tanstack/react-query';
import type { MetricsHistory } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface UseTVLHistoryOptions {
  hours?: number;
  limit?: number;
  refetchInterval?: number;
}

/**
 * Hook to fetch full TVL history for detailed chart visualization.
 *
 * Fetches historical TVL metrics with configurable time range.
 * Used for TVLHistoryChart component on the History page.
 *
 * @param options - Configuration options
 * @param options.hours - Number of hours to look back (default: 168 = 7 days)
 * @param options.limit - Maximum number of data points (default: 500)
 * @param options.refetchInterval - Refetch interval in ms (default: 30000)
 *
 * @returns Query result with TVL history data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTVLHistory({ hours: 168 });
 *
 * if (data) {
 *   console.log(`${data.data_points} data points over ${data.hours} hours`);
 * }
 * ```
 */
export function useTVLHistory(options: UseTVLHistoryOptions = {}) {
  const {
    hours = 168, // 7 days
    limit = 500,
    refetchInterval = 30000, // 30 seconds
  } = options;

  return useQuery<MetricsHistory>({
    queryKey: ['tvlHistory', hours, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: 'tvl',
        hours: hours.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(
        `${API_URL}/api/analytics/history?${params}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch TVL history: ${response.statusText}`);
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
