// frontend/lib/hooks/useUpdateTier.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { STAKING_POOL_ADDRESS, STAKING_POOL_ABI } from '../contracts';
import { toast } from 'react-hot-toast';

// Tier default configurations (base APY in basis points)
const TIER_DEFAULTS = {
  0: { minDuration: 7 * 24 * 60 * 60, apy: 500, penalty: 200 }, // 7 days, 5% APY, 20% penalty
  1: { minDuration: 30 * 24 * 60 * 60, apy: 800, penalty: 300 }, // 30 days, 8% APY, 30% penalty
  2: { minDuration: 90 * 24 * 60 * 60, apy: 1200, penalty: 500 }, // 90 days, 12% APY, 50% penalty
};

/**
 * Hook to update tier configuration (owner only)
 * Used for testing with multiplied APYs
 * @returns Functions and states for updating tiers
 */
export function useUpdateTier() {
  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  /**
   * Update a tier with custom parameters
   * @param tierId - Tier ID (0, 1, or 2)
   * @param minDuration - Minimum duration in seconds
   * @param apy - APY in basis points (e.g., 500 = 5%)
   * @param penalty - Early withdrawal penalty in basis points (e.g., 200 = 20%)
   */
  const updateTier = (
    tierId: number,
    minDuration: number,
    apy: number,
    penalty: number
  ) => {
    if (tierId < 0 || tierId > 2) {
      toast.error('Invalid tier ID. Must be 0, 1, or 2.');
      return;
    }

    writeContract(
      {
        address: STAKING_POOL_ADDRESS,
        abi: STAKING_POOL_ABI,
        functionName: 'updateTier',
        args: [tierId as any, minDuration as any, apy as any, penalty as any],
      },
      {
        onSuccess: () => {
          toast.success(`Tier ${tierId} updated!`);
        },
        onError: (error) => {
          if (error.message.includes('Ownable')) {
            toast.error('Only contract owner can update tiers');
          } else {
            toast.error(`Update failed: ${error.message}`);
          }
        },
      }
    );
  };

  /**
   * Multiply APY for all tiers (for testing)
   * @param multiplier - Multiplier (e.g., 10, 100, 1000)
   */
  const multiplyAPY = async (multiplier: number) => {
    toast.loading(`Multiplying all APYs by ${multiplier}x...`);

    try {
      // Update all three tiers
      for (let tierId = 0; tierId <= 2; tierId++) {
        const config = TIER_DEFAULTS[tierId as keyof typeof TIER_DEFAULTS];
        await updateTier(
          tierId,
          config.minDuration,
          config.apy * multiplier,
          config.penalty
        );

        // Wait a bit between transactions
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      toast.dismiss();
      toast.success(`All APYs multiplied by ${multiplier}x!`);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to multiply APYs');
    }
  };

  /**
   * Reset all tiers to default values
   */
  const resetToDefaults = async () => {
    toast.loading('Resetting tiers to defaults...');

    try {
      for (let tierId = 0; tierId <= 2; tierId++) {
        const config = TIER_DEFAULTS[tierId as keyof typeof TIER_DEFAULTS];
        await updateTier(
          tierId,
          config.minDuration,
          config.apy,
          config.penalty
        );

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      toast.dismiss();
      toast.success('Tiers reset to defaults!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to reset tiers');
    }
  };

  return {
    updateTier,
    multiplyAPY,
    resetToDefaults,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error: writeError,
  };
}
