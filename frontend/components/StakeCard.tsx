// frontend/components/StakeCard.tsx
'use client';

import { useEffect } from 'react';
import { formatUnits } from 'viem';
import { format } from 'date-fns';
import { useCalculateRewards } from '@/lib/hooks/useUserStakes';
import { useClaimRewards } from '@/lib/hooks/useClaimRewards';
import { useUnstake } from '@/lib/hooks/useUnstake';
import type { Stake } from '@/types';

const TIER_NAMES = ['Bronze (7d)', 'Silver (30d)', 'Gold (90d)'];
const TIER_APY = ['5%', '8%', '12%'];

interface StakeCardProps {
  stake: Stake;
  userAddress: `0x${string}`;
  onUpdate?: () => void;
}

export function StakeCard({ stake, userAddress, onUpdate }: StakeCardProps) {
  const { rewards, refetch: refetchRewards } = useCalculateRewards(
    userAddress,
    stake.stake_index
  );

  const { claimRewards, isPending: isClaiming, isConfirming: isClaimConfirming, isConfirmed: isClaimConfirmed } = useClaimRewards();
  const { unstake, isPending: isUnstaking, isConfirming: isUnstakeConfirming, isConfirmed: isUnstakeConfirmed } = useUnstake();

  // Refetch rewards periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refetchRewards();
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [refetchRewards]);

  // Call onUpdate after successful transactions
  useEffect(() => {
    if (isClaimConfirmed || isUnstakeConfirmed) {
      onUpdate?.();
    }
  }, [isClaimConfirmed, isUnstakeConfirmed, onUpdate]);

  const handleClaim = () => {
    claimRewards(stake.stake_index);
  };

  const handleUnstake = () => {
    unstake(stake.stake_index);
  };

  const amountFormatted = formatUnits(BigInt(stake.amount), 18);
  const rewardsFormatted = rewards ? formatUnits(rewards, 18) : '0';
  const startDate = new Date(stake.start_time);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">Stake #{stake.stake_index}</h3>
          <p className="text-sm text-gray-400">
            {TIER_NAMES[stake.tier_id]} • {TIER_APY[stake.tier_id]} APY
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          stake.status === 'active'
            ? 'bg-green-600/20 text-green-400'
            : 'bg-gray-600/20 text-gray-400'
        }`}>
          {stake.status === 'active' ? 'Active' : 'Inactive'}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-400">Staked Amount</p>
          <p className="text-xl font-semibold">{parseFloat(amountFormatted).toFixed(2)} DAI</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Rewards</p>
          <p className="text-xl font-semibold text-green-400">
            {parseFloat(rewardsFormatted).toFixed(4)} DAI
          </p>
        </div>
      </div>

      {/* Date Info */}
      <div className="text-sm text-gray-400">
        <p>Started: {format(startDate, 'MMM dd, yyyy HH:mm')}</p>
      </div>

      {/* Actions */}
      {stake.status === 'active' && (
        <div className="flex gap-3">
          <button
            onClick={handleClaim}
            disabled={isClaiming || isClaimConfirming || !rewards || rewards === 0n}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            {isClaiming || isClaimConfirming ? 'Claiming...' : 'Claim Rewards'}
          </button>
          <button
            onClick={handleUnstake}
            disabled={isUnstaking || isUnstakeConfirming}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            {isUnstaking || isUnstakeConfirming ? 'Unstaking...' : 'Unstake'}
          </button>
        </div>
      )}
    </div>
  );
}
