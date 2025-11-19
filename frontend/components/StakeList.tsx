// frontend/components/StakeList.tsx
'use client';

import { useAccount } from 'wagmi';
import { StakeCard } from './StakeCard';
import { useUserStakesFromAPI } from '@/lib/hooks/useUserStakes';

export function StakeList() {
  const { address } = useAccount();
  const { data: stakes, isLoading, error, refetch } = useUserStakesFromAPI(
    address?.toLowerCase(),
    'active'
  );

  if (!address) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
        Connect your wallet to view your stakes
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading stakes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center text-red-400">
        Failed to load stakes. Please try again.
      </div>
    );
  }

  if (!stakes || stakes.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
        <p className="mb-2">No active stakes found</p>
        <p className="text-sm">Create your first stake to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Stakes ({stakes.length})</h2>
      <div className="space-y-3">
        {stakes.map((stake) => (
          <StakeCard
            key={`${stake.user_address}-${stake.stake_index}`}
            stake={stake}
            userAddress={address}
            onUpdate={refetch}
          />
        ))}
      </div>
    </div>
  );
}
