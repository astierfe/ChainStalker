// frontend/lib/hooks/useBlockTime.ts
import { useState, useEffect } from 'react';
import { getBlockTimestamp, getBlockNumber } from '../utils/anvil-rpc';

/**
 * Hook to get current blockchain time
 * @param autoRefresh - Whether to auto-refresh every interval
 * @param refreshInterval - Refresh interval in milliseconds (default: 5000)
 * @returns Current block timestamp and number
 */
export function useBlockTime(autoRefresh = false, refreshInterval = 5000) {
  const [blockTimestamp, setBlockTimestamp] = useState<number | null>(null);
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBlockInfo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [timestamp, number] = await Promise.all([
        getBlockTimestamp(),
        getBlockNumber(),
      ]);
      setBlockTimestamp(timestamp);
      setBlockNumber(number);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch block info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchBlockInfo();

    // Setup auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchBlockInfo, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return {
    blockTimestamp,
    blockNumber,
    isLoading,
    error,
    refetch: fetchBlockInfo,
  };
}
