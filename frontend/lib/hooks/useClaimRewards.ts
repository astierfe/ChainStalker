// frontend/lib/hooks/useClaimRewards.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { STAKING_POOL_ADDRESS, STAKING_POOL_ABI } from '../contracts';
import { toast } from 'react-hot-toast';

/**
 * Hook to claim rewards without unstaking
 * @returns Functions and states for claiming rewards
 */
export function useClaimRewards() {
  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  /**
   * Claim rewards for a stake
   * @param stakeIndex - Index of the stake to claim rewards from
   */
  const claimRewards = (stakeIndex: number) => {
    writeContract(
      {
        address: STAKING_POOL_ADDRESS,
        abi: STAKING_POOL_ABI,
        functionName: 'claimRewards',
        args: [BigInt(stakeIndex)],
      },
      {
        onSuccess: () => {
          toast.success('Claim transaction sent!');
        },
        onError: (error) => {
          if (error.message.includes('No rewards to claim')) {
            toast.error('No rewards available to claim');
          } else if (error.message.includes('Insufficient reward pool')) {
            toast.error('Insufficient rewards in pool');
          } else {
            toast.error(`Claim failed: ${error.message}`);
          }
        },
      }
    );
  };

  return {
    claimRewards,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error: writeError,
  };
}
