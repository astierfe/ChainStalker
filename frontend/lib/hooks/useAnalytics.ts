// frontend/lib/hooks/useAnalytics.ts
import { useQuery } from '@tanstack/react-query';
import { useReadContract } from 'wagmi';
import { STAKING_POOL_ADDRESS, STAKING_POOL_ABI } from '../contracts';
import type { AnalyticsData } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Hook to fetch analytics from backend API
 * @returns Analytics data (TVL, users, stakes, tiers, rewards)
 */
export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/analytics/`);

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      return data as AnalyticsData;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook to get contract info from smart contract
 * @returns Contract state (TVL, reward pool balance, paused status)
 */
export function useContractInfo() {
  // Total staked
  const { data: totalStaked, refetch: refetchTotalStaked } = useReadContract({
    address: STAKING_POOL_ADDRESS,
    abi: STAKING_POOL_ABI,
    functionName: 'totalStaked',
  });

  // Reward pool balance
  const { data: rewardPoolBalance, refetch: refetchRewardPool } =
    useReadContract({
      address: STAKING_POOL_ADDRESS,
      abi: STAKING_POOL_ABI,
      functionName: 'rewardPoolBalance',
    });

  // Paused status
  const { data: paused, refetch: refetchPaused } = useReadContract({
    address: STAKING_POOL_ADDRESS,
    abi: STAKING_POOL_ABI,
    functionName: 'paused',
  });

  const refetchAll = () => {
    refetchTotalStaked();
    refetchRewardPool();
    refetchPaused();
  };

  return {
    totalStaked: totalStaked as bigint | undefined,
    rewardPoolBalance: rewardPoolBalance as bigint | undefined,
    paused: paused as boolean | undefined,
    refetch: refetchAll,
  };
}

/**
 * Hook to get tier information from smart contract
 * @param tierId - Tier ID (0, 1, or 2)
 * @returns Tier configuration
 */
export function useTierInfo(tierId: number) {
  const { data: tier, refetch } = useReadContract({
    address: STAKING_POOL_ADDRESS,
    abi: STAKING_POOL_ABI,
    functionName: 'getTier',
    args: [tierId],
  });

  return {
    tier: tier as
      | {
          minDuration: bigint;
          apy: bigint;
          earlyWithdrawPenalty: bigint;
        }
      | undefined,
    refetch,
  };
}
