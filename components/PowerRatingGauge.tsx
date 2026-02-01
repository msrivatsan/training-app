'use client';

import { motion } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';
import {
  getStrengthLevel,
  getPowerRatingGaugeColor,
  formatPowerRating,
} from '@/lib/gamification/power-rating';

interface PowerRatingGaugeProps {
  powerRating: number;
  previousRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export default function PowerRatingGauge({
  powerRating,
  previousRating,
  size = 'md',
  showDetails = true,
}: PowerRatingGaugeProps) {
  const strengthLevel = getStrengthLevel(powerRating);
  const gaugeColor = getPowerRatingGaugeColor(powerRating);

  // Calculate improvement
  const improvement =
    previousRating && previousRating > 0
      ? powerRating - previousRating
      : null;
  const improvementPercent =
    improvement && previousRating
      ? ((improvement / previousRating) * 100).toFixed(1)
      : null;

  // Size configurations
  const sizes = {
    sm: { gauge: 120, stroke: 10, fontSize: 'text-2xl' },
    md: { gauge: 180, stroke: 12, fontSize: 'text-4xl' },
    lg: { gauge: 240, stroke: 16, fontSize: 'text-5xl' },
  };

  const config = sizes[size];
  const radius = (config.gauge - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate gauge fill (max at 25 for visual purposes)
  const maxRating = 25;
  const percentage = Math.min((powerRating / maxRating) * 100, 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      {/* Circular gauge */}
      <div className="relative" style={{ width: config.gauge, height: config.gauge }}>
        <svg
          width={config.gauge}
          height={config.gauge}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={config.gauge / 2}
            cy={config.gauge / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.stroke}
            className="text-gray-200 dark:text-gray-700"
          />

          {/* Progress circle */}
          <motion.circle
            cx={config.gauge / 2}
            cy={config.gauge / 2}
            r={radius}
            fill="none"
            stroke={gaugeColor}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Zap
            className="w-6 h-6 mb-1"
            style={{ color: gaugeColor }}
            fill={gaugeColor}
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className={`font-bold ${config.fontSize}`}
            style={{ color: gaugeColor }}
          >
            {formatPowerRating(powerRating)}
          </motion.div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Power
          </p>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 text-center"
        >
          {/* Strength level */}
          <div className="mb-2">
            <span className={`text-lg font-bold ${strengthLevel.color}`}>
              {strengthLevel.level}
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {strengthLevel.description}
          </p>

          {/* Improvement indicator */}
          {improvement !== null && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1, type: 'spring' }}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                improvement > 0
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : improvement < 0
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
              }`}
            >
              {improvement > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : improvement < 0 ? (
                <TrendingDown className="w-4 h-4" />
              ) : null}
              {improvement > 0 ? '+' : ''}
              {improvement.toFixed(2)} ({improvementPercent}%)
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
