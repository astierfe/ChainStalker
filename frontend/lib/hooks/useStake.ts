// frontend/lib/hooks/useStake.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { STAKING_POOL_ADDRESS, STAKING_POOL_ABI } from '../contracts';
import { toast } from 'react-hot-toast';

/**
 * Hook to create a new stake
 * @returns Functions and states for staking
 */
export function useStake() {
  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  /**
   * Create a new stake
   * @param amount - Amount in DAI (as string, e.g., "1000")
   * @param tierId - Tier ID (0 = 7d/5%, 1 = 30d/8%, 2 = 90d/12%)
   */
  const stake = (amount: string, tierId: number) => {
    try {
      const amountInWei = parseUnits(amount, 18);

      if (tierId < 0 || tierId > 2) {
        toast.error('Invalid tier ID. Must be 0, 1, or 2.');
        return;
      }

      writeContract(
        {
          address: STAKING_POOL_ADDRESS,
          abi: STAKING_POOL_ABI,
          functionName: 'stake',
          args: [amountInWei, tierId],
        },
        {
          onSuccess: () => {
            toast.success('Stake transaction sent!');
          },
          onError: (error) => {
            if (error.message.includes('insufficient allowance')) {
              toast.error('Please approve DAI first');
            } else if (error.message.includes('insufficient funds')) {
              toast.error('Insufficient DAI balance');
            } else {
              toast.error(`Stake failed: ${error.message}`);
            }
          },
        }
      );
    } catch (error) {
      toast.error('Invalid amount');
    }
  };

  return {
    stake,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error: writeError,
  };
}
