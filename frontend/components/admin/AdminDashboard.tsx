// frontend/components/admin/AdminDashboard.tsx
'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { TimeTravelPanel } from './TimeTravelPanel';
import { APYMultiplierPanel } from './APYMultiplierPanel';
import { BlockInfoPanel } from './BlockInfoPanel';

export function AdminDashboard() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-red-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                  Admin Demo Tools
                </h1>
                <span className="bg-red-600/20 text-red-400 text-xs font-semibold px-3 py-1 rounded-full">
                  TESTING ONLY
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Tools for manipulating time and testing reward accrual
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                ← Back to Dashboard
              </Link>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isConnected ? (
          <div className="space-y-8">
            {/* Warning Banner */}
            <div className="bg-yellow-900/20 border-2 border-yellow-600/30 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <span className="text-3xl">⚠️</span>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                    Admin Tools - Use with Caution
                  </h3>
                  <ul className="text-sm text-yellow-200/80 space-y-1">
                    <li>• <strong>Time Travel:</strong> Works with Anvil local blockchain only</li>
                    <li>• <strong>APY Multiplier:</strong> Requires wallet to be contract owner</li>
                    <li>• <strong>Testing Purpose:</strong> These tools are for development/testing only</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Admin Panels Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Time Travel */}
              <div>
                <TimeTravelPanel />
              </div>

              {/* Block Info */}
              <div>
                <BlockInfoPanel />
              </div>
            </div>

            {/* APY Multiplier - Full Width */}
            <div>
              <APYMultiplierPanel />
            </div>

            {/* Usage Instructions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">📖 How to Use</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold text-blue-400 mb-2">Testing Reward Accrual:</h4>
                  <ol className="space-y-2 text-gray-300">
                    <li>1. Create a stake on the main dashboard</li>
                    <li>2. Come to Admin page</li>
                    <li>3. Click "+7 Days" to fast-forward time</li>
                    <li>4. Return to dashboard to see accrued rewards</li>
                    <li>5. Claim or unstake to collect rewards</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-400 mb-2">Testing High APY:</h4>
                  <ol className="space-y-2 text-gray-300">
                    <li>1. Click "×100" to multiply all APYs by 100</li>
                    <li>2. Create a new stake (or wait with existing)</li>
                    <li>3. Fast-forward just 1 hour</li>
                    <li>4. See rewards like 100 hours passed</li>
                    <li>5. Click "Reset to Normal APYs" when done</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Not Connected */
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <h2 className="text-2xl font-semibold mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-400 mb-6">
              Connect your wallet to access admin tools
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
