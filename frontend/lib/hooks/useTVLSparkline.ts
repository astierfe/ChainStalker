// frontend/lib/hooks/useTVLSparkline.ts
import { useQuery } from '@tanstack/react-query';
import type { TVLSparklineData } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface UseTVLSparklineOptions {
  hours?: number;
  points?: number;
  refetchInterval?: number;
}

/**
 * Hook to fetch TVL sparkline data for dashboard visualization.
 *
 * Fetches historical TVL data with change metrics for displaying
 * mini sparkline chart on the dashboard.
 *
 * @param options - Configuration options
 * @param options.hours - Number of hours to look back (default: 24)
 * @param options.points - Number of data points to return (default: 50)
 * @param options.refetchInterval - Refetch interval in ms (default: 30000)
 *
 * @returns Query result with TVL sparkline data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTVLSparkline({ hours: 24, points: 50 });
 *
 * if (data) {
 *   console.log(`Current TVL: ${data.current_tvl}`);
 *   console.log(`24h Change: ${data.change_percent_24h}%`);
 * }
 * ```
 */
export function useTVLSparkline(options: UseTVLSparklineOptions = {}) {
  const {
    hours = 24,
    points = 50,
    refetchInterval = 30000, // 30 seconds
  } = options;

  return useQuery<TVLSparklineData>({
    queryKey: ['tvlSparkline', hours, points],
    queryFn: async () => {
      const params = new URLSearchParams({
        hours: hours.toString(),
        points: points.toString(),
      });

      const response = await fetch(
        `${API_URL}/api/analytics/tvl/sparkline?${params}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch TVL sparkline: ${response.statusText}`);
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
