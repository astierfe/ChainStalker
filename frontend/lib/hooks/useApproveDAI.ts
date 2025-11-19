// frontend/lib/hooks/useApproveDAI.ts
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { DAI_TOKEN_ADDRESS, STAKING_POOL_ADDRESS, ERC20_ABI } from '../contracts';
import { toast } from 'react-hot-toast';

/**
 * Hook to approve DAI tokens for staking
 * @returns Functions and states for approving DAI
 */
export function useApproveDAI() {
  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  /**
   * Approve DAI for staking
   * @param amount - Amount in DAI (as string, e.g., "1000")
   */
  const approve = (amount: string) => {
    try {
      const amountInWei = parseUnits(amount, 18);

      writeContract(
        {
          address: DAI_TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [STAKING_POOL_ADDRESS, amountInWei],
        },
        {
          onSuccess: () => {
            toast.success('Approval transaction sent!');
          },
          onError: (error) => {
            toast.error(`Approval failed: ${error.message}`);
          },
        }
      );
    } catch (error) {
      toast.error('Invalid amount');
    }
  };

  return {
    approve,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error: writeError,
  };
}

/**
 * Hook to check current DAI allowance for staking pool
 * @param userAddress - Address to check allowance for
 * @returns Current allowance in wei
 */
export function useDAIAllowance(userAddress?: `0x${string}`) {
  const { data: allowance, refetch } = useReadContract({
    address: DAI_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: userAddress ? [userAddress, STAKING_POOL_ADDRESS] : undefined,
  });

  return {
    allowance: allowance as bigint | undefined,
    refetch,
  };
}

/**
 * Hook to get user's DAI balance
 * @param userAddress - Address to check balance for
 * @returns DAI balance in wei
 */
export function useDAIBalance(userAddress?: `0x${string}`) {
  const { data: balance, refetch } = useReadContract({
    address: DAI_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
  });

  return {
    balance: balance as bigint | undefined,
    refetch,
  };
}
