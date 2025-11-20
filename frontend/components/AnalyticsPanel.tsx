// frontend/components/AnalyticsPanel.tsx
'use client';

import { useAnalytics } from '@/lib/hooks/useAnalytics';

export function AnalyticsPanel() {
  const { data: analytics, isLoading, error } = useAnalytics();

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center text-red-400">
        Failed to load analytics
      </div>
    );
  }

  const tvl = analytics.tvl?.tvl_formatted || '0 DAI';
  const totalUsers = analytics.users?.total_users || 0;
  const activeUsers = analytics.users?.active_users || 0;
  const activeStakes = analytics.stakes?.active_stakes || 0;

  // Calculate average APY from tiers
  const tiers = analytics.tiers?.tiers || [];
  const avgAPY = tiers.length > 0
    ? (tiers.reduce((sum, tier) => sum + (tier.tier_id === 0 ? 5 : tier.tier_id === 1 ? 8 : 12), 0) / tiers.length).toFixed(1)
    : '8.3';

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Platform Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TVL Card */}
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-600/30 rounded-lg p-6">
          <div className="text-sm text-blue-400 font-medium mb-2">Total Value Locked</div>
          <div className="text-3xl font-bold text-white">{tvl}</div>
          <div className="text-sm text-gray-400 mt-2">{activeStakes} active stakes</div>
        </div>

        {/* Users Card */}
        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-600/30 rounded-lg p-6">
          <div className="text-sm text-green-400 font-medium mb-2">Total Users</div>
          <div className="text-3xl font-bold text-white">{totalUsers}</div>
          <div className="text-sm text-gray-400 mt-2">{activeUsers} active</div>
        </div>

        {/* APY Card */}
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-600/30 rounded-lg p-6">
          <div className="text-sm text-purple-400 font-medium mb-2">Average APY</div>
          <div className="text-3xl font-bold text-white">{avgAPY}%</div>
          <div className="text-sm text-gray-400 mt-2">Across {tiers.length} tiers</div>
        </div>
      </div>

      {/* Tier Distribution */}
      {tiers.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Tier Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier) => (
              <div key={tier.tier_id} className="bg-gray-700/50 rounded-lg p-4">
                <div className="text-sm text-gray-400">{tier.tier_name}</div>
                <div className="text-2xl font-bold mt-1">{tier.stake_count}</div>
                <div className="text-sm text-gray-400 mt-1">
                  {tier.total_staked_formatted || `${tier.total_staked} DAI`} total
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
