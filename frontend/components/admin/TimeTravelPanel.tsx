// frontend/components/admin/TimeTravelPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTimeTravel } from '@/lib/hooks/useTimeTravel';
import { format } from 'date-fns';

export function TimeTravelPanel() {
  const [customHours, setCustomHours] = useState('');
  const {
    fastForwardHours,
    fastForwardDays,
    refreshBlockInfo,
    currentBlockTime,
    currentBlockNumber,
    isLoading,
  } = useTimeTravel();

  // Load block info on mount
  useEffect(() => {
    refreshBlockInfo();
  }, [refreshBlockInfo]);

  const handleCustomFastForward = () => {
    const hours = parseFloat(customHours);
    if (hours > 0) {
      fastForwardHours(hours);
      setCustomHours('');
    }
  };

  const blockTimeFormatted = currentBlockTime
    ? format(new Date(currentBlockTime * 1000), 'MMM dd, yyyy HH:mm:ss')
    : 'Loading...';

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">⏰ Time Travel</h2>
        <p className="text-sm text-gray-400">
          Manipulate blockchain time for testing (Anvil only)
        </p>
      </div>

      {/* Current Time */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-1">Current Block Time</div>
        <div className="text-xl font-mono font-semibold">{blockTimeFormatted}</div>
        <div className="text-sm text-gray-400 mt-2">
          Block #{currentBlockNumber?.toString() || '...'}
        </div>
        <button
          onClick={refreshBlockInfo}
          className="mt-3 text-sm text-blue-400 hover:text-blue-300"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="text-sm font-medium text-gray-300 mb-3">Quick Fast-Forward</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            onClick={() => fastForwardHours(1)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            +1 Hour
          </button>
          <button
            onClick={() => fastForwardDays(1)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            +1 Day
          </button>
          <button
            onClick={() => fastForwardDays(7)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            +7 Days
          </button>
          <button
            onClick={() => fastForwardDays(30)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            +30 Days
          </button>
          <button
            onClick={() => fastForwardDays(90)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            +90 Days
          </button>
          <button
            onClick={() => fastForwardDays(365)}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            +1 Year
          </button>
        </div>
      </div>

      {/* Custom Time */}
      <div>
        <div className="text-sm font-medium text-gray-300 mb-3">Custom Fast-Forward</div>
        <div className="flex gap-3">
          <input
            type="number"
            value={customHours}
            onChange={(e) => setCustomHours(e.target.value)}
            placeholder="Hours"
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            min="0"
            step="0.1"
          />
          <button
            onClick={handleCustomFastForward}
            disabled={!customHours || isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center text-blue-400 text-sm">
          Manipulating time...
        </div>
      )}
    </div>
  );
}
