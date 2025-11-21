// frontend/components/PeriodSelector.tsx
'use client';

interface PeriodSelectorProps {
  selectedPeriod: number;
  onPeriodChange: (hours: number) => void;
  periods?: { label: string; hours: number }[];
}

/**
 * Period selector component for filtering historical data.
 *
 * Displays buttons for selecting different time periods (7d/30d/90d).
 * Used in History page to filter chart data.
 */
export function PeriodSelector({
  selectedPeriod,
  onPeriodChange,
  periods = [
    { label: '7D', hours: 168 },
    { label: '30D', hours: 720 },
    { label: '90D', hours: 2160 },
  ],
}: PeriodSelectorProps) {
  return (
    <div className="flex gap-2">
      {periods.map(({ label, hours }) => (
        <button
          key={hours}
          onClick={() => onPeriodChange(hours)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedPeriod === hours
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
