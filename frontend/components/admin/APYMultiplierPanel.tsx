// frontend/components/admin/APYMultiplierPanel.tsx
'use client';

import { useUpdateTier } from '@/lib/hooks/useUpdateTier';
import { useTierInfo } from '@/lib/hooks/useAnalytics';

export function APYMultiplierPanel() {
  const { multiplyAPY, resetToDefaults, isPending, isConfirming } = useUpdateTier();

  // Get current tier info
  const { tier: tier0 } = useTierInfo(0);
  const { tier: tier1 } = useTierInfo(1);
  const { tier: tier2 } = useTierInfo(2);

  const currentAPYs = [
    tier0 ? Number(tier0.apy) / 100 : 5,
    tier1 ? Number(tier1.apy) / 100 : 8,
    tier2 ? Number(tier2.apy) / 100 : 12,
  ];

  const handleMultiply = (multiplier: number) => {
    multiplyAPY(multiplier);
  };

  const handleReset = () => {
    resetToDefaults();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">📈 APY Multiplier</h2>
        <p className="text-sm text-gray-400">
          Modify tier APYs for faster testing (Owner only)
        </p>
      </div>

      {/* Current APYs */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="text-sm text-gray-400 mb-3">Current APYs</div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-orange-400">Bronze (Tier 0)</div>
            <div className="text-2xl font-bold">{currentAPYs[0]}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Silver (Tier 1)</div>
            <div className="text-2xl font-bold">{currentAPYs[1]}%</div>
          </div>
          <div>
            <div className="text-sm text-yellow-400">Gold (Tier 2)</div>
            <div className="text-2xl font-bold">{currentAPYs[2]}%</div>
          </div>
        </div>
      </div>

      {/* Multipliers */}
      <div>
        <div className="text-sm font-medium text-gray-300 mb-3">
          Multiply All APYs By:
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleMultiply(10)}
            disabled={isPending || isConfirming}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            ×10
          </button>
          <button
            onClick={() => handleMultiply(100)}
            disabled={isPending || isConfirming}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            ×100
          </button>
          <button
            onClick={() => handleMultiply(1000)}
            disabled={isPending || isConfirming}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            ×1000
          </button>
        </div>
      </div>

      {/* Reset */}
      <div>
        <button
          onClick={handleReset}
          disabled={isPending || isConfirming}
          className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {isPending || isConfirming ? 'Resetting...' : 'Reset to Normal APYs'}
        </button>
      </div>

      {/* Warning */}
      <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
        <div className="text-sm text-yellow-400">
          <strong>⚠️ Warning:</strong> This modifies the smart contract state. Only the
          contract owner can perform this action. Use for testing purposes only.
        </div>
      </div>

      {(isPending || isConfirming) && (
        <div className="text-center text-blue-400 text-sm">
          Updating tiers... This may take a few moments.
        </div>
      )}
    </div>
  );
}
