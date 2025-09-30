// frontend/app/test/page.tsx - v1.0
'use client';

import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { STAKING_POOL_ADDRESS, DAI_TOKEN_ADDRESS, STAKING_POOL_ABI, ERC20_ABI } from '@/lib/contracts';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function TestPage() {
  const { address, isConnected } = useAccount();

  // Test 1: Lecture StakingPool - totalStaked
  const { data: totalStaked, isLoading: loadingTotal, error: errorTotal } = useReadContract({
    address: STAKING_POOL_ADDRESS,
    abi: STAKING_POOL_ABI,
    functionName: 'totalStaked',
  });

  // Test 2: Lecture StakingPool - rewardPoolBalance
  const { data: rewardPool, isLoading: loadingReward, error: errorReward } = useReadContract({
    address: STAKING_POOL_ADDRESS,
    abi: STAKING_POOL_ABI,
    functionName: 'rewardPoolBalance',
  });

  // Test 3: Lecture StakingPool - paused
  const { data: isPaused, isLoading: loadingPaused, error: errorPaused } = useReadContract({
    address: STAKING_POOL_ADDRESS,
    abi: STAKING_POOL_ABI,
    functionName: 'paused',
  });

  // Test 4: Lecture DAI - balance du user connecté
  const { data: daiBalance, isLoading: loadingDai, error: errorDai } = useReadContract({
    address: DAI_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Test 5: Lecture DAI - decimals
  const { data: daiDecimals } = useReadContract({
    address: DAI_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });

  // Test 6: Lecture StakingPool - getUserStakeCount
  const { data: stakeCount, isLoading: loadingCount, error: errorCount } = useReadContract({
    address: STAKING_POOL_ADDRESS,
    abi: STAKING_POOL_ABI,
    functionName: 'getUserStakeCount',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return (
    <div className="min-h-screen p-8 bg-gray-900">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">🧪 Contract Tests</h1>
          <ConnectButton />
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {/* Test 1: Total Staked */}
          <TestCard
            title="Test 1: Total Staked"
            loading={loadingTotal}
            error={errorTotal?.message}
            success={totalStaked !== undefined}
          >
            {totalStaked !== undefined && (
              <p className="font-mono text-lg">
                {formatUnits(totalStaked as bigint, 18)} DAI
              </p>
            )}
          </TestCard>

          {/* Test 2: Reward Pool */}
          <TestCard
            title="Test 2: Reward Pool Balance"
            loading={loadingReward}
            error={errorReward?.message}
            success={rewardPool !== undefined}
          >
            {rewardPool !== undefined && (
              <p className="font-mono text-lg">
                {formatUnits(rewardPool as bigint, 18)} DAI
              </p>
            )}
          </TestCard>

          {/* Test 3: Paused Status */}
          <TestCard
            title="Test 3: Contract Paused"
            loading={loadingPaused}
            error={errorPaused?.message}
            success={isPaused !== undefined}
          >
            {isPaused !== undefined && (
              <p className="font-mono text-lg">
                {isPaused ? '⏸️ PAUSED' : '✅ ACTIVE'}
              </p>
            )}
          </TestCard>

          {/* Test 4: User DAI Balance */}
          <TestCard
            title="Test 4: Your DAI Balance"
            loading={loadingDai}
            error={errorDai?.message}
            success={daiBalance !== undefined}
            requiresWallet={!isConnected}
          >
            {daiBalance !== undefined && (
              <p className="font-mono text-lg">
                {formatUnits(daiBalance as bigint, daiDecimals as number || 18)} DAI
              </p>
            )}
          </TestCard>

          {/* Test 5: User Stake Count */}
          <TestCard
            title="Test 5: Your Stake Count"
            loading={loadingCount}
            error={errorCount?.message}
            success={stakeCount !== undefined}
            requiresWallet={!isConnected}
          >
            {stakeCount !== undefined && (
              <p className="font-mono text-lg">
                {(stakeCount as bigint).toString()} stake(s)
              </p>
            )}
          </TestCard>
        </div>

        {/* Summary */}
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-300 mb-4">
            📊 Test Summary
          </h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-300">
              <span className="text-green-400">✓</span> StakingPool ABI: {STAKING_POOL_ADDRESS}
            </p>
            <p className="text-gray-300">
              <span className="text-green-400">✓</span> DAI Token ABI: {DAI_TOKEN_ADDRESS}
            </p>
            <p className="text-gray-300">
              <span className="text-green-400">✓</span> Wagmi Hooks: useReadContract
            </p>
            <p className="text-gray-300">
              <span className="text-green-400">✓</span> RPC: {process.env.NEXT_PUBLIC_RPC_URL}
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <a 
            href="/"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

interface TestCardProps {
  title: string;
  loading: boolean;
  error?: string;
  success: boolean;
  requiresWallet?: boolean;
  children?: React.ReactNode;
}

function TestCard({ title, loading, error, success, requiresWallet, children }: TestCardProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div>
          {loading && <span className="text-yellow-400">⏳ Loading...</span>}
          {error && <span className="text-red-400">❌ Error</span>}
          {success && !loading && <span className="text-green-400">✅ Success</span>}
          {requiresWallet && <span className="text-gray-400">🔌 Connect Wallet</span>}
        </div>
      </div>

      <div className="text-gray-300">
        {requiresWallet ? (
          <p className="text-gray-500 italic">Connect your wallet to test</p>
        ) : error ? (
          <p className="text-red-400 text-sm font-mono break-all">{error}</p>
        ) : loading ? (
          <p className="text-gray-500">Fetching data...</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
