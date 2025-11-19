// frontend/lib/hooks/useUnstake.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { STAKING_POOL_ADDRESS, STAKING_POOL_ABI } from '../contracts';
import { toast } from 'react-hot-toast';

/**
 * Hook to unstake tokens (withdraw principal + rewards)
 * @returns Functions and states for unstaking
 */
export function useUnstake() {
  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  /**
   * Unstake tokens
   * @param stakeIndex - Index of the stake to unstake
   */
  const unstake = (stakeIndex: number) => {
    writeContract(
      {
        address: STAKING_POOL_ADDRESS,
        abi: STAKING_POOL_ABI,
        functionName: 'unstake',
        args: [BigInt(stakeIndex)],
      },
      {
        onSuccess: () => {
          toast.success('Unstake transaction sent!');
        },
        onError: (error) => {
          if (error.message.includes('Stake not active')) {
            toast.error('This stake is already inactive');
          } else if (error.message.includes('Insufficient reward pool')) {
            toast.error('Insufficient rewards in pool');
          } else {
            toast.error(`Unstake failed: ${error.message}`);
          }
        },
      }
    );
  };

  return {
    unstake,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error: writeError,
  };
}
