// frontend/app/page.tsx - v1.0
'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export default function Home() {
  const { address, isConnected } = useAccount();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            ChainStaker
          </h1>
          <p className="text-xl text-gray-400">
            Decentralized DAI Staking Platform
          </p>
        </div>

        {/* Connect Wallet */}
        <div className="flex justify-center">
          <ConnectButton />
        </div>

        {/* Status */}
        {isConnected && (
          <div className="bg-gray-800 rounded-lg p-6 space-y-4">
            <h2 className="text-2xl font-semibold">✅ Wallet Connected</h2>
            <p className="text-gray-300">
              <span className="font-mono text-blue-400">{address}</span>
            </p>
            <div className="text-sm text-gray-400">
              <p>• Chain: Anvil Local (31337)</p>
              <p>• StakingPool: {process.env.NEXT_PUBLIC_STAKING_POOL_ADDRESS}</p>
              <p>• DAI Token: {process.env.NEXT_PUBLIC_DAI_TOKEN_ADDRESS}</p>
            </div>
          </div>
        )}

        {/* Phase 3.1 Status */}
        <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-green-400 mb-2">
            ✅ Phase 3.1 Complete
          </h3>
          <p className="text-gray-300">
            Technical foundations are ready! Next: Phase 3.2 (API Layer + Hooks)
          </p>
        </div>
      </main>
    </div>
  );
}
