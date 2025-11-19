// frontend/lib/hooks/useTimeTravel.ts
import { useState } from 'react';
import { increaseTime, getBlockTimestamp, getBlockNumber, timeUnits } from '../utils/anvil-rpc';
import { toast } from 'react-hot-toast';

/**
 * Hook to manipulate time in Anvil (local testing only)
 * @returns Functions and states for time manipulation
 */
export function useTimeTravel() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentBlockTime, setCurrentBlockTime] = useState<number | null>(null);
  const [currentBlockNumber, setCurrentBlockNumber] = useState<number | null>(null);

  /**
   * Fast-forward time by specified amount
   * @param seconds - Number of seconds to advance
   */
  const fastForward = async (seconds: number) => {
    setIsLoading(true);
    try {
      await increaseTime(seconds);
      await refreshBlockInfo();

      const hours = Math.floor(seconds / 3600);
      const days = Math.floor(seconds / 86400);

      if (days > 0) {
        toast.success(`⏰ Time advanced by ${days} day${days > 1 ? 's' : ''}!`);
      } else if (hours > 0) {
        toast.success(`⏰ Time advanced by ${hours} hour${hours > 1 ? 's' : ''}!`);
      } else {
        toast.success(`⏰ Time advanced by ${seconds} seconds!`);
      }
    } catch (error) {
      toast.error('Failed to advance time. Are you connected to Anvil?');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh current block timestamp and number
   */
  const refreshBlockInfo = async () => {
    try {
      const [timestamp, blockNumber] = await Promise.all([
        getBlockTimestamp(),
        getBlockNumber(),
      ]);
      setCurrentBlockTime(timestamp);
      setCurrentBlockNumber(blockNumber);
    } catch (error) {
      console.error('Failed to fetch block info:', error);
    }
  };

  /**
   * Convenience functions for common time jumps
   */
  const fastForwardHours = (hours: number) => fastForward(timeUnits.hours(hours));
  const fastForwardDays = (days: number) => fastForward(timeUnits.days(days));
  const fastForwardWeeks = (weeks: number) => fastForward(timeUnits.weeks(weeks));

  return {
    fastForward,
    fastForwardHours,
    fastForwardDays,
    fastForwardWeeks,
    refreshBlockInfo,
    currentBlockTime,
    currentBlockNumber,
    isLoading,
  };
}
