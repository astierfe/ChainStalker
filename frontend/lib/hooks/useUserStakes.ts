// frontend/lib/hooks/useUserStakes.ts
import { useQuery } from '@tanstack/react-query';
import { useReadContract } from 'wagmi';
import { STAKING_POOL_ADDRESS, STAKING_POOL_ABI } from '../contracts';
import type { Stake } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Hook to fetch user's stakes from backend API
 * @param address - User's wallet address
 * @param status - Filter by status ('active' | 'inactive' | 'all')
 * @returns User's stakes
 */
export function useUserStakesFromAPI(
  address?: string,
  status: 'active' | 'inactive' | 'all' = 'active'
) {
  return useQuery({
    queryKey: ['userStakes', address, status],
    queryFn: async () => {
      if (!address) return [];

      const response = await fetch(
        `${API_URL}/api/users/${address}/stakes?status=${status}`
      );

      // Treat 404 as "no stakes yet" rather than an error
      // This happens when the user hasn't created any stakes yet
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user stakes');
      }

      const data = await response.json();
      return data.stakes as Stake[];
    },
    enabled: !!address,
    refetchInterval: 3000, // Reduced from 10s to 3s for faster UI updates after transactions
  });
}

/**
 * Hook to get user's stake count from smart contract
 * @param address - User's wallet address
 * @returns Number of stakes
 */
export function useUserStakeCount(address?: `0x${string}`) {
  const { data: count, refetch } = useReadContract({
    address: STAKING_POOL_ADDRESS,
    abi: STAKING_POOL_ABI,
    functionName: 'getUserStakeCount',
    args: address ? [address] : undefined,
  });

  return {
    count: count as bigint | undefined,
    refetch,
  };
}

/**
 * Hook to get a specific stake from smart contract
 * @param address - User's wallet address
 * @param stakeIndex - Index of the stake
 * @returns Stake data
 */
export function useStakeFromContract(
  address?: `0x${string}`,
  stakeIndex?: number
) {
  const { data: stake, refetch } = useReadContract({
    address: STAKING_POOL_ADDRESS,
    abi: STAKING_POOL_ABI,
    functionName: 'getUserStake',
    args:
      address !== undefined && stakeIndex !== undefined
        ? [address, BigInt(stakeIndex)]
        : undefined,
  });

  return {
    stake: stake as
      | {
          amount: bigint;
          startTime: bigint;
          lastRewardClaim: bigint;
          tierId: number;
          active: boolean;
        }
      | undefined,
    refetch,
  };
}

/**
 * Hook to calculate rewards for a stake
 * @param address - User's wallet address
 * @param stakeIndex - Index of the stake
 * @returns Calculated rewards
 */
export function useCalculateRewards(
  address?: `0x${string}`,
  stakeIndex?: number
) {
  const { data: rewards, refetch } = useReadContract({
    address: STAKING_POOL_ADDRESS,
    abi: STAKING_POOL_ABI,
    functionName: 'calculateRewards',
    args:
      address !== undefined && stakeIndex !== undefined
        ? [address, BigInt(stakeIndex)]
        : undefined,
  });

  return {
    rewards: rewards as bigint | undefined,
    refetch,
  };
}
