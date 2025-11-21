// frontend/components/Dashboard.tsx
'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { AnalyticsPanel } from './AnalyticsPanel';
import { StakeForm } from './StakeForm';
import { StakeList } from './StakeList';
import { TVLSparklineCard } from './TVLSparklineCard';
import { TopStakersCompact } from './TopStakersCompact';

export function Dashboard() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  ChainStaker
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Decentralized DAI Staking Platform
                </p>
              </div>
              <nav className="hidden md:flex gap-4">
                <Link
                  href="/"
                  className="text-blue-400 font-medium hover:text-blue-300 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/history"
                  className="text-gray-400 font-medium hover:text-white transition-colors"
                >
                  History
                </Link>
              </nav>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Analytics Panel */}
          <AnalyticsPanel />

          {isConnected ? (
            /* Staking Interface */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Stake Form + Analytics Cards */}
              <div className="space-y-4">
                <StakeForm />

                {/* TVL Sparkline */}
                <TVLSparklineCard />

                {/* Top 3 Stakers */}
                <TopStakersCompact />
              </div>

              {/* Right Column: Stake List */}
              <div>
                <StakeList />
              </div>
            </div>
          ) : (
            /* Not Connected */
            <div className="bg-gray-800 rounded-lg p-12 text-center">
              <h2 className="text-2xl font-semibold mb-4">
                Connect Your Wallet to Get Started
              </h2>
              <p className="text-gray-400 mb-6">
                Connect your wallet to start staking DAI and earning rewards
              </p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-400">
            <p>ChainStaker - Built with Next.js, Wagmi, and RainbowKit</p>
            <p className="mt-1">
              Network: <span className="text-blue-400">SEPOLIA</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
