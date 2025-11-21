// frontend/components/RewardsTimelineChart.tsx
'use client';

import { useState } from 'react';
import { useRewardsTimeline } from '@/lib/hooks/useRewardsTimeline';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface RewardsTimelineChartProps {
  days?: number;
}

/**
 * Rewards timeline chart showing daily rewards claimed.
 *
 * Displays daily and cumulative rewards views with toggle.
 * Used on the History page.
 */
export function RewardsTimelineChart({ days = 30 }: RewardsTimelineChartProps) {
  const { data, isLoading, error } = useRewardsTimeline({ days });
  const [viewMode, setViewMode] = useState<'daily' | 'cumulative'>('daily');

  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 border border-red-500 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Rewards Timeline</h3>
        <p className="text-sm text-gray-400">{error.message}</p>
      </div>
    );
  }

  if (!data || data.timeline.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Rewards Timeline</h3>
        <p className="text-sm text-gray-400">No rewards data available yet.</p>
      </div>
    );
  }

  // Transform data for Recharts
  const chartData = data.timeline.map((point, idx, arr) => {
    const cumulativeRewards = arr
      .slice(0, idx + 1)
      .reduce((sum, p) => sum + p.rewards_dai, 0);

    return {
      date: point.date,
      timestamp: new Date(point.timestamp).getTime(),
      daily: point.rewards_dai,
      cumulative: cumulativeRewards,
      claims: point.claim_count,
      formattedDate: format(new Date(point.timestamp), 'MMM dd, yyyy'),
    };
  });

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold mb-1">Rewards Claimed Timeline</h3>
          <p className="text-sm text-gray-400">
            Total: {data.total_rewards_dai.toFixed(2)} DAI across {data.total_claims} claims
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'daily'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setViewMode('cumulative')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'cumulative'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Cumulative
          </button>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorRewards" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="timestamp"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(timestamp) => format(new Date(timestamp), 'MMM dd')}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(value) => `${value.toFixed(0)} DAI`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: '#F9FAFB',
            }}
            labelFormatter={(timestamp) => format(new Date(timestamp as number), 'MMM dd, yyyy')}
            formatter={(value: number, name: string) => {
              if (name === 'daily' || name === 'cumulative') {
                return [`${value.toFixed(2)} DAI`, viewMode === 'daily' ? 'Daily Rewards' : 'Cumulative Rewards'];
              }
              return [value, 'Claims'];
            }}
          />
          <Area
            type="monotone"
            dataKey={viewMode}
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#colorRewards)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Data updates every 15 minutes • {data.data_points} days recorded
        </p>
      </div>
    </div>
  );
}
