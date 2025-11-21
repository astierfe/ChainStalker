// frontend/components/TopStakersLeaderboard.tsx
'use client';

import { useState } from 'react';
import { useTopStakers } from '@/lib/hooks/useTopStakers';

/**
 * Full leaderboard table showing top stakers with pagination.
 *
 * Displays top 20 stakers with sorting and filtering options.
 * Used on the History page.
 */
export function TopStakersLeaderboard() {
  const [limit] = useState(20);
  const { data, isLoading, error } = useTopStakers({ limit });

  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 border border-red-500 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Leaderboard</h3>
        <p className="text-sm text-gray-400">{error.message}</p>
      </div>
    );
  }

  if (!data || data.stakers.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Top Stakers Leaderboard</h3>
        <p className="text-sm text-gray-400">No stakers data available yet.</p>
      </div>
    );
  }

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-1">Top Stakers Leaderboard</h3>
        <p className="text-sm text-gray-400">
          Top {data.count} stakers by total staked amount
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Rank</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Address</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Total Staked</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Active Stakes</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Rewards Claimed</th>
            </tr>
          </thead>
          <tbody>
            {data.stakers.map((staker) => (
              <tr
                key={staker.address}
                className="border-b border-gray-700 hover:bg-gray-700 transition-colors"
              >
                <td className="py-3 px-4">
                  <span className="text-lg font-bold">
                    {getMedalEmoji(staker.rank)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-gray-300 font-mono">
                      {staker.address.slice(0, 6)}...{staker.address.slice(-4)}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(staker.address)}
                      className="text-gray-500 hover:text-gray-300 transition-colors"
                      title="Copy address"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="font-semibold text-blue-400">
                    {staker.total_staked_formatted}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-gray-300">
                    {staker.active_stakes}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-green-400">
                    {(parseInt(staker.rewards_claimed) / 1e18).toFixed(2)} DAI
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Data updates every 15 minutes • Last updated: {data.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}
        </p>
      </div>
    </div>
  );
}
