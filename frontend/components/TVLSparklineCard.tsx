// frontend/components/TVLSparklineCard.tsx
'use client';

import { useTVLSparkline } from '@/lib/hooks/useTVLSparkline';
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

/**
 * TVL Mini Dashboard Card with Sparkline
 *
 * Displays current TVL, 24h change, and a sparkline chart showing
 * TVL evolution over the selected time period.
 *
 * Features:
 * - Current TVL with formatted display
 * - 24h change with percentage and direction indicator
 * - Animated sparkline chart (Recharts)
 * - Hover tooltip showing exact values
 * - Loading skeleton state
 * - Error fallback state
 * - Responsive design
 */
export function TVLSparklineCard() {
  const { data, isLoading, error } = useTVLSparkline({
    hours: 24,
    points: 50,
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-3"></div>
        <div className="h-8 bg-gray-700 rounded w-2/3 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-16 bg-gray-700 rounded"></div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="bg-gray-800 border border-red-700/50 rounded-lg p-6">
        <p className="text-sm text-gray-400 mb-2">Total Value Locked</p>
        <p className="text-2xl font-bold text-gray-500 mb-1">
          Unavailable
        </p>
        <p className="text-xs text-red-400">
          {error?.message || 'Failed to load TVL data'}
        </p>
      </div>
    );
  }

  // Determine if change is positive, negative, or neutral
  const changeIsPositive = data.change_percent_24h > 0;
  const changeIsNegative = data.change_percent_24h < 0;
  const changeColor = changeIsPositive
    ? 'text-green-400'
    : changeIsNegative
    ? 'text-red-400'
    : 'text-gray-400';
  const lineColor = changeIsPositive ? '#4ade80' : changeIsNegative ? '#f87171' : '#9ca3af';

  // Format absolute change with sign
  const formattedChange = changeIsPositive
    ? `+${data.change_24h.toFixed(2)}`
    : data.change_24h.toFixed(2);

  const formattedPercent = changeIsPositive
    ? `+${data.change_percent_24h.toFixed(2)}%`
    : `${data.change_percent_24h.toFixed(2)}%`;

  // Custom tooltip for hovering over sparkline
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const date = new Date(dataPoint.timestamp);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      return (
        <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2 shadow-lg">
          <p className="text-xs text-gray-400 mb-1">{formattedDate}</p>
          <p className="text-sm font-semibold text-white">
            ${dataPoint.value_dai.toLocaleString()} DAI
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-2">Total Value Locked (24h)</p>

        {/* Current TVL */}
        <div className="flex items-baseline gap-2 mb-2">
          <h3 className="text-3xl font-bold text-white">
            ${data.current_tvl}
          </h3>
          <span className="text-sm text-gray-500">DAI</span>
        </div>

        {/* 24h Change */}
        <div className={`flex items-center gap-2 ${changeColor}`}>
          {changeIsPositive && (
            <span className="text-lg font-bold">↗</span>
          )}
          {changeIsNegative && (
            <span className="text-lg font-bold">↘</span>
          )}
          <span className="text-sm font-medium">
            {formattedChange} DAI ({formattedPercent})
          </span>
          <span className="text-xs text-gray-500">vs 24h ago</span>
        </div>
      </div>

      {/* Sparkline Chart */}
      <div className="h-16 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.data_points}>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value_dai"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          {data.points_returned} data points over {data.period_hours} hours
        </p>
      </div>
    </div>
  );
}
