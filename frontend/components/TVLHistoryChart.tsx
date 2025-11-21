// frontend/components/TVLHistoryChart.tsx
'use client';

import { useTVLHistory } from '@/lib/hooks/useTVLHistory';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface TVLHistoryChartProps {
  hours?: number;
}

/**
 * Full TVL history chart with detailed visualization.
 *
 * Displays historical TVL data with zoom/pan capabilities.
 * Used on the History page for deep analysis.
 */
export function TVLHistoryChart({ hours = 168 }: TVLHistoryChartProps) {
  const { data, isLoading, error } = useTVLHistory({ hours });

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
        <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading TVL History</h3>
        <p className="text-sm text-gray-400">{error.message}</p>
      </div>
    );
  }

  if (!data || data.data_points === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">TVL History</h3>
        <p className="text-sm text-gray-400">No historical data available yet.</p>
      </div>
    );
  }

  // Transform data for Recharts
  const chartData = data.history.map((point) => {
    const valueWei = typeof point.value === 'string' ? point.value : String(point.value);
    const valueDai = parseFloat(valueWei) / 1e18;

    return {
      timestamp: new Date(point.timestamp).getTime(),
      value: valueDai,
      formattedDate: format(new Date(point.timestamp), 'MMM dd, HH:mm'),
    };
  });

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-1">Total Value Locked History</h3>
        <p className="text-sm text-gray-400">
          {data.data_points} data points over {hours / 24} days
        </p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
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
            labelFormatter={(timestamp) => format(new Date(timestamp as number), 'MMM dd, yyyy HH:mm')}
            formatter={(value: number) => [`${value.toFixed(2)} DAI`, 'TVL']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#3B82F6' }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Data updates every 5 minutes
        </p>
      </div>
    </div>
  );
}
