// frontend/components/TopStakersCompact.tsx
'use client';

import { useTopStakers } from '@/lib/hooks/useTopStakers';

/**
 * Top 3 Stakers Compact Card
 *
 * Displays the top 3 stakers with medal indicators on the dashboard.
 * Data is sourced from the Celery task `snapshot_top_users()` (runs every 15min).
 *
 * Features:
 * - Medal indicators (🥇🥈🥉) for top 3 ranks
 * - Formatted addresses (0x1234...5678)
 * - Formatted DAI amounts with 2 decimals
 * - Loading skeleton state
 * - Error fallback state
 * - Responsive design
 */
export function TopStakersCompact() {
  const { data, isLoading, error } = useTopStakers();

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-1/2 mb-4"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-3 last:mb-0">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-800 border border-red-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          🏆 Top 3 Stakers
        </h3>
        <p className="text-sm text-red-400">
          {error?.message || 'Failed to load top stakers'}
        </p>
      </div>
    );
  }

  // Empty state (no data yet)
  if (!data || data.stakers.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          🏆 Top 3 Stakers
        </h3>
        <p className="text-sm text-gray-400">
          {data?.message || 'No stakers yet. Be the first to stake!'}
        </p>
      </div>
    );
  }

  // Helper to format address
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Medal mapping
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
      {/* Header */}
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        🏆 Top 3 Stakers
      </h3>

      {/* Stakers List */}
      <div className="space-y-3">
        {data.stakers.map((staker, index) => (
          <div
            key={staker.address}
            className="p-3 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-900/70 transition-colors"
          >
            {/* Rank & Address */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl" title={`Rank ${staker.rank}`}>
                {medals[index]}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono">#{staker.rank}</span>
                <span className="text-sm font-mono text-gray-300">
                  {formatAddress(staker.address)}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div className="ml-9">
              <p className="text-base font-semibold text-white">
                {staker.total_staked_formatted}
              </p>
              <p className="text-xs text-gray-500">
                {staker.active_stakes} active stake{staker.active_stakes !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Timestamp */}
      {data.timestamp && (
        <div className="mt-4 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Updated: {new Date(data.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      )}
    </div>
  );
}
