// frontend/components/ActivityHeatmap.tsx
'use client';

import { useState } from 'react';
import { useActivityHeatmap } from '@/lib/hooks/useActivityHeatmap';

/**
 * Activity heatmap showing hourly event distribution.
 *
 * Displays a calendar-style heatmap of blockchain events by hour/day.
 * Used on the History page.
 */
export function ActivityHeatmap() {
  const [eventFilter, setEventFilter] = useState<string>('total');
  const { data, isLoading, error } = useActivityHeatmap({ days: 7 });

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
        <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Activity Heatmap</h3>
        <p className="text-sm text-gray-400">{error.message}</p>
      </div>
    );
  }

  if (!data || data.heatmap.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Activity Heatmap</h3>
        <p className="text-sm text-gray-400">No activity data available yet.</p>
      </div>
    );
  }

  // Group data by date
  const dateMap = new Map<string, Map<number, any>>();
  data.heatmap.forEach((point) => {
    if (!dateMap.has(point.date)) {
      dateMap.set(point.date, new Map());
    }
    dateMap.get(point.date)!.set(point.hour, point);
  });

  const dates = Array.from(dateMap.keys()).sort();
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Calculate color intensity
  const maxValue = Math.max(
    ...data.heatmap.map((p) =>
      eventFilter === 'total'
        ? p.total
        : eventFilter === 'StakeCreated'
        ? p.StakeCreated
        : eventFilter === 'RewardsClaimed'
        ? p.RewardsClaimed
        : p.Unstaked
    )
  );

  const getColor = (value: number) => {
    if (value === 0) return 'bg-gray-800';
    const intensity = Math.min(value / maxValue, 1);
    if (intensity < 0.2) return 'bg-blue-900';
    if (intensity < 0.4) return 'bg-blue-800';
    if (intensity < 0.6) return 'bg-blue-700';
    if (intensity < 0.8) return 'bg-blue-600';
    return 'bg-blue-500';
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold mb-1">Activity Heatmap</h3>
          <p className="text-sm text-gray-400">
            {data.total_events} total events over {data.days_covered} days
          </p>
        </div>
        <div className="flex gap-2">
          {['total', 'StakeCreated', 'RewardsClaimed', 'Unstaked'].map((filter) => (
            <button
              key={filter}
              onClick={() => setEventFilter(filter)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                eventFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {filter === 'total' ? 'All' : filter.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Hour labels */}
          <div className="flex gap-1 mb-2 ml-20">
            {[0, 6, 12, 18].map((hour) => (
              <div key={hour} className="w-6 text-center text-xs text-gray-500">
                {hour}h
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          {dates.map((date) => (
            <div key={date} className="flex items-center gap-1 mb-1">
              <div className="w-16 text-xs text-gray-400 text-right pr-2">
                {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="flex gap-0.5">
                {hours.map((hour) => {
                  const hourData = dateMap.get(date)?.get(hour);
                  const value = hourData
                    ? eventFilter === 'total'
                      ? hourData.total
                      : hourData[eventFilter]
                    : 0;
                  const color = getColor(value);

                  return (
                    <div
                      key={hour}
                      className={`w-6 h-6 ${color} rounded transition-colors cursor-pointer hover:ring-2 hover:ring-blue-400`}
                      title={`${date} ${hour}:00 - ${value} events`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
        <span>Less</span>
        <div className="w-6 h-4 bg-gray-800 rounded"></div>
        <div className="w-6 h-4 bg-blue-900 rounded"></div>
        <div className="w-6 h-4 bg-blue-700 rounded"></div>
        <div className="w-6 h-4 bg-blue-500 rounded"></div>
        <span>More</span>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Data updates every 15 minutes • Hover over cells for details
        </p>
      </div>
    </div>
  );
}
