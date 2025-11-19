// frontend/components/TierSelector.tsx
'use client';

interface Tier {
  id: number;
  name: string;
  duration: string;
  apy: string;
  penalty: string;
  color: string;
}

const TIERS: Tier[] = [
  {
    id: 0,
    name: 'Bronze',
    duration: '7 days',
    apy: '5%',
    penalty: '20%',
    color: 'border-orange-600 hover:bg-orange-600/10',
  },
  {
    id: 1,
    name: 'Silver',
    duration: '30 days',
    apy: '8%',
    penalty: '30%',
    color: 'border-gray-400 hover:bg-gray-400/10',
  },
  {
    id: 2,
    name: 'Gold',
    duration: '90 days',
    apy: '12%',
    penalty: '50%',
    color: 'border-yellow-500 hover:bg-yellow-500/10',
  },
];

interface TierSelectorProps {
  selectedTier: number;
  onSelectTier: (tierId: number) => void;
}

export function TierSelector({ selectedTier, onSelectTier }: TierSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-300">Select Tier</label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {TIERS.map((tier) => (
          <button
            key={tier.id}
            onClick={() => onSelectTier(tier.id)}
            className={`
              p-4 rounded-lg border-2 transition-all text-left
              ${
                selectedTier === tier.id
                  ? `${tier.color} bg-opacity-20`
                  : 'border-gray-700 hover:border-gray-600'
              }
            `}
          >
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{tier.name}</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Min Duration:</span>
                  <span className="text-white">{tier.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">APY:</span>
                  <span className="text-green-400 font-semibold">{tier.apy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Early Penalty:</span>
                  <span className="text-red-400">{tier.penalty}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
