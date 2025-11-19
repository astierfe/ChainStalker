// frontend/components/admin/BlockInfoPanel.tsx
'use client';

import { useBlockTime } from '@/lib/hooks/useBlockTime';
import { format } from 'date-fns';

export function BlockInfoPanel() {
  const { blockTimestamp, blockNumber, isLoading, refetch } = useBlockTime(true, 5000);

  const blockTimeFormatted = blockTimestamp
    ? format(new Date(blockTimestamp * 1000), 'MMM dd, yyyy HH:mm:ss')
    : 'Loading...';

  const blockTimeLocal = blockTimestamp
    ? new Date(blockTimestamp * 1000).toLocaleString()
    : 'Loading...';

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">📊 Blockchain Info</h2>
        <p className="text-sm text-gray-400">
          Real-time blockchain information
        </p>
      </div>

      {/* Info Cards */}
      <div className="space-y-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Current Block Number</div>
          <div className="text-3xl font-mono font-bold">
            {blockNumber?.toLocaleString() || '...'}
          </div>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Block Timestamp (Unix)</div>
          <div className="text-2xl font-mono font-semibold">
            {blockTimestamp?.toString() || '...'}
          </div>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Block Time (Formatted)</div>
          <div className="text-lg font-mono">
            {blockTimeFormatted}
          </div>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Block Time (Local)</div>
          <div className="text-lg font-mono">
            {blockTimeLocal}
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={refetch}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        {isLoading ? 'Refreshing...' : '↻ Refresh Now'}
      </button>

      <div className="text-xs text-gray-500 text-center">
        Auto-refreshes every 5 seconds
      </div>
    </div>
  );
}
