// frontend/app/history/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { PeriodSelector } from '@/components/PeriodSelector';
import { TVLHistoryChart } from '@/components/TVLHistoryChart';
import { RewardsTimelineChart } from '@/components/RewardsTimelineChart';
import { TopStakersLeaderboard } from '@/components/TopStakersLeaderboard';
import { ActivityHeatmap } from '@/components/ActivityHeatmap';

/**
 * History page - Deep analytics and historical data visualization.
 *
 * Displays 4 main charts:
 * - TVL History Chart (full timeline with zoom/pan)
 * - Rewards Timeline Chart (daily/cumulative rewards)
 * - Top Stakers Leaderboard (top 20 stakers)
 * - Activity Heatmap (hourly event distribution)
 */
export default function HistoryPage() {
  const [selectedPeriod, setSelectedPeriod] = useState(168); // 7 days in hours

  // Convert hours to days for components that use days
  const selectedDays = Math.floor(selectedPeriod / 24);

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
                  className="text-gray-400 font-medium hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/history"
                  className="text-blue-400 font-medium hover:text-blue-300 transition-colors"
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
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Historical Analytics</h2>
              <p className="text-gray-400">
                Deep dive into platform metrics and activity patterns
              </p>
            </div>
            <PeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
          </div>
        </div>

        {/* Charts Grid */}
        <div className="space-y-8">
          {/* Top Section: TVL History (Full Width) */}
          <section>
            <TVLHistoryChart hours={selectedPeriod} />
          </section>

          {/* Middle Section: Rewards Timeline & Activity Heatmap (Side by Side) */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <RewardsTimelineChart days={selectedDays} />
            <ActivityHeatmap />
          </section>

          {/* Bottom Section: Top Stakers Leaderboard (Full Width) */}
          <section>
            <TopStakersLeaderboard />
          </section>
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
