// frontend/lib/hooks/useStake.ts
import { useState, useEffect, useRef } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { STAKING_POOL_ADDRESS, STAKING_POOL_ABI, DAI_TOKEN_ADDRESS, DAI_TOKEN_ABI } from '../contracts';
import { toast } from 'react-hot-toast';

/**
 * Hook to create a new stake with automatic DAI approval.
 *
 * Flow:
 * 1. Check allowance when stake() is called
 * 2. If allowance < amount: approve 5x amount (buffer for future stakes)
 * 3. Auto-stake after approval confirms
 * 4. If allowance >= amount: stake directly
 *
 * @returns Functions and states for staking with auto-approval
 */
export function useStake() {
  const { address } = useAccount();
  const [pendingStake, setPendingStake] = useState<{ amount: bigint; tierId: number } | null>(null);

  // Stake transaction
  const {
    data: stakeHash,
    writeContract: writeStake,
    isPending: isStakePending,
    error: stakeError,
  } = useWriteContract();

  const { isLoading: isStakeConfirming, isSuccess: isStakeConfirmed } =
    useWaitForTransactionReceipt({ hash: stakeHash });

  // Approval transaction
  const {
    data: approveHash,
    writeContract: writeApprove,
    isPending: isApprovePending,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({ hash: approveHash });

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: DAI_TOKEN_ADDRESS,
    abi: DAI_TOKEN_ABI,
    functionName: 'allowance',
    args: address ? [address, STAKING_POOL_ADDRESS] : undefined,
  });

  /**
   * Execute stake transaction.
   */
  const executeStake = (amountInWei: bigint, tierId: number) => {
    writeStake(
      {
        address: STAKING_POOL_ADDRESS,
        abi: STAKING_POOL_ABI,
        functionName: 'stake',
        args: [amountInWei, tierId],
      },
      {
        onSuccess: () => {
          toast.success('Stake transaction sent!');
          setPendingStake(null); // Clear pending stake
        },
        onError: (error) => {
          if (error.message.includes('insufficient funds')) {
            toast.error('Insufficient DAI balance');
          } else {
            toast.error(`Stake failed: ${error.message}`);
          }
          setPendingStake(null);
        },
      }
    );
  };

  /**
   * Auto-stake after approval confirms.
   */
  useEffect(() => {
    if (isApproveConfirmed && pendingStake) {
      toast.success('Approval confirmed! Staking now... (2/2)');
      executeStake(pendingStake.amount, pendingStake.tierId);
    }
  }, [isApproveConfirmed, pendingStake]);

  /**
   * Create a new stake (with automatic approval if needed).
   *
   * @param amount - Amount in DAI (as string, e.g., "1000")
   * @param tierId - Tier ID (0 = 7d/5%, 1 = 30d/8%, 2 = 90d/12%)
   */
  const stake = async (amount: string, tierId: number) => {
    try {
      const amountInWei = parseUnits(amount, 18);

      if (tierId < 0 || tierId > 2) {
        toast.error('Invalid tier ID. Must be 0, 1, or 2.');
        return;
      }

      // Refetch current allowance
      const { data: currentAllowance } = await refetchAllowance();
      const allowanceBigInt = (currentAllowance as bigint) || 0n;

      // Check if approval is needed
      if (allowanceBigInt < amountInWei) {
        // Store stake details for auto-execution after approval
        setPendingStake({ amount: amountInWei, tierId });

        // Calculate approval amount: 5x the stake amount (buffer for future stakes)
        const approvalAmount = amountInWei * 5n;

        toast.loading('Approving DAI... (1/2)', { id: 'approval' });

        // Request approval
        writeApprove(
          {
            address: DAI_TOKEN_ADDRESS,
            abi: DAI_TOKEN_ABI,
            functionName: 'approve',
            args: [STAKING_POOL_ADDRESS, approvalAmount],
          },
          {
            onError: (error) => {
              toast.error(`Approval failed: ${error.message}`, { id: 'approval' });
              setPendingStake(null);
            },
          }
        );

        return;
      }

      // If allowance is sufficient, stake directly
      executeStake(amountInWei, tierId);
    } catch (error) {
      toast.error('Invalid amount');
    }
  };

  return {
    stake,
    isPending: isStakePending || isApprovePending,
    isConfirming: isStakeConfirming || isApproveConfirming,
    isConfirmed: isStakeConfirmed,
    isApprovingDAI: isApprovePending || isApproveConfirming,
    isApproveConfirmed,
    hash: stakeHash,
    error: stakeError,
    currentAllowance: (allowance as bigint) || 0n,
  };
}
