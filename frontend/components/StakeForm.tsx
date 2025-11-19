// frontend/components/StakeForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { TierSelector } from './TierSelector';
import { useApproveDAI, useDAIAllowance, useDAIBalance } from '@/lib/hooks/useApproveDAI';
import { useStake } from '@/lib/hooks/useStake';

export function StakeForm() {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState(0);

  // Hooks
  const { balance } = useDAIBalance(address);
  const { allowance, refetch: refetchAllowance } = useDAIAllowance(address);
  const { approve, isPending: isApproving, isConfirming: isApprovingConfirming, isConfirmed: isApproveConfirmed } = useApproveDAI();
  const { stake, isPending: isStaking, isConfirming: isStakingConfirming, isConfirmed: isStakeConfirmed } = useStake();

  // Refetch allowance after approval
  useEffect(() => {
    if (isApproveConfirmed) {
      refetchAllowance();
    }
  }, [isApproveConfirmed, refetchAllowance]);

  // Reset form after successful stake
  useEffect(() => {
    if (isStakeConfirmed) {
      setAmount('');
    }
  }, [isStakeConfirmed]);

  const handleApprove = () => {
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }
    approve(amount);
  };

  const handleStake = () => {
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }
    stake(amount, selectedTier);
  };

  // Check if amount is approved
  const amountBN = amount ? parseUnits(amount, 18) : 0n;
  const isApproved = allowance !== undefined && allowance >= amountBN && amountBN > 0n;

  const balanceFormatted = balance ? formatUnits(balance, 18) : '0';

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <h2 className="text-2xl font-bold">Create New Stake</h2>

      {/* Amount Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Amount (DAI)</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            step="0.01"
            min="0"
          />
          <button
            onClick={() => setAmount(balanceFormatted)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            MAX
          </button>
        </div>
        <div className="text-sm text-gray-400">
          Balance: {parseFloat(balanceFormatted).toFixed(2)} DAI
        </div>
      </div>

      {/* Tier Selector */}
      <TierSelector selectedTier={selectedTier} onSelectTier={setSelectedTier} />

      {/* Action Buttons */}
      <div className="space-y-3">
        {!isApproved ? (
          <button
            onClick={handleApprove}
            disabled={!amount || parseFloat(amount) <= 0 || isApproving || isApprovingConfirming}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {isApproving || isApprovingConfirming
              ? 'Approving...'
              : 'Approve DAI'}
          </button>
        ) : (
          <button
            onClick={handleStake}
            disabled={!amount || parseFloat(amount) <= 0 || isStaking || isStakingConfirming}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {isStaking || isStakingConfirming
              ? 'Staking...'
              : 'Stake DAI'}
          </button>
        )}

        {isApproved && (
          <p className="text-sm text-green-400 text-center">
            ✓ Amount approved - Ready to stake
          </p>
        )}
      </div>
    </div>
  );
}
