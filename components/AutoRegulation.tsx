'use client';

import { useState } from 'react';
import { getRpeDescription, getRpeColor } from '@/lib/auto-regulation';

interface AutoRegulationProps {
  onRpeSelect: (rpe: number) => void;
  currentRpe?: number | null;
  showDescription?: boolean;
}

export default function AutoRegulation({
  onRpeSelect,
  currentRpe,
  showDescription = true,
}: AutoRegulationProps) {
  const [selectedRpe, setSelectedRpe] = useState<number | null>(currentRpe || null);
  const [showInfo, setShowInfo] = useState(false);

  const handleRpeSelect = (rpe: number) => {
    setSelectedRpe(rpe);
    onRpeSelect(rpe);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Rate of Perceived Exertion</label>
          <button
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>

        {selectedRpe && (
          <span className="text-sm font-semibold text-indigo-600">RPE: {selectedRpe}</span>
        )}
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
          <p className="font-semibold mb-1">What is RPE?</p>
          <p>
            RPE (Rate of Perceived Exertion) helps track how hard each set feels. Use this to
            auto-regulate your training and avoid overtraining.
          </p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>RPE 7-8.5 = Optimal training zone</li>
            <li>RPE &gt;9 = Very hard, close to failure</li>
            <li>RPE &lt;7 = Too easy, increase weight</li>
          </ul>
        </div>
      )}

      {/* RPE Selector */}
      <div className="grid grid-cols-5 gap-2">
        {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((rpe) => (
          <button
            key={rpe}
            type="button"
            onClick={() => handleRpeSelect(rpe)}
            className={`
              relative py-3 px-2 rounded-lg font-semibold text-sm transition-all
              ${
                selectedRpe === rpe
                  ? 'ring-2 ring-offset-2 ring-indigo-500 shadow-lg scale-105'
                  : 'hover:scale-105'
              }
              ${getRpeButtonColor(rpe, selectedRpe === rpe)}
            `}
          >
            <div className="text-center">
              <div className="text-lg">{rpe}</div>
              {selectedRpe === rpe && (
                <div className="absolute -top-1 -right-1">
                  <svg
                    className="w-5 h-5 text-indigo-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Description */}
      {showDescription && selectedRpe && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">RPE {selectedRpe}:</span>{' '}
            {getRpeDescription(selectedRpe)}
          </p>
        </div>
      )}
    </div>
  );
}

function getRpeButtonColor(rpe: number, isSelected: boolean): string {
  const baseColors = {
    blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    green: 'bg-green-100 text-green-700 hover:bg-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    orange: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
    red: 'bg-red-100 text-red-700 hover:bg-red-200',
  };

  const selectedColors = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    orange: 'bg-orange-500 text-white',
    red: 'bg-red-500 text-white',
  };

  const colorKey = getRpeColor(rpe) as keyof typeof baseColors;

  return isSelected ? selectedColors[colorKey] : baseColors[colorKey];
}

/**
 * RPE Recommendation Badge
 * Shows auto-regulation recommendations based on recent RPE trends
 */
interface RpeRecommendationBadgeProps {
  averageRpe: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export function RpeRecommendationBadge({ averageRpe, trend }: RpeRecommendationBadgeProps) {
  const getRecommendation = () => {
    if (averageRpe >= 9.0) {
      return {
        type: 'warning',
        icon: '⚠️',
        title: 'High Fatigue Detected',
        message: 'Consider a deload or reducing weight',
        bgColor: 'bg-red-50 border-red-200',
        textColor: 'text-red-900',
      };
    }

    if (averageRpe < 7.0) {
      return {
        type: 'success',
        icon: '📈',
        title: 'Ready to Progress',
        message: 'You can handle more weight - increase by 2.5-5kg',
        bgColor: 'bg-green-50 border-green-200',
        textColor: 'text-green-900',
      };
    }

    if (trend === 'increasing' && averageRpe >= 8.5) {
      return {
        type: 'info',
        icon: '👀',
        title: 'Monitor Closely',
        message: 'RPE is trending upward - watch for fatigue',
        bgColor: 'bg-yellow-50 border-yellow-200',
        textColor: 'text-yellow-900',
      };
    }

    return {
      type: 'optimal',
      icon: '✅',
      title: 'Optimal Training Zone',
      message: 'RPE is in the sweet spot (7-8.5) - keep it up!',
      bgColor: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-900',
    };
  };

  const recommendation = getRecommendation();

  return (
    <div className={`${recommendation.bgColor} border rounded-lg p-3`}>
      <div className="flex items-start gap-2">
        <span className="text-2xl">{recommendation.icon}</span>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${recommendation.textColor}`}>
            {recommendation.title}
          </p>
          <p className="text-xs text-gray-600 mt-1">{recommendation.message}</p>

          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span>Avg RPE: {averageRpe.toFixed(1)}</span>
            <span>•</span>
            <span>
              Trend:{' '}
              {trend === 'increasing' ? '↑' : trend === 'decreasing' ? '↓' : '→'} {trend}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
