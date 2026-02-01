'use client';

import { motion } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';
import { LevelTier } from '@/lib/gamification/types';
import { getLevelBadgeColor } from '@/lib/gamification/xp-utils';

interface LevelBadgeProps {
  level: number;
  title: LevelTier;
  currentXp?: number;
  xpToNext?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export default function LevelBadge({
  level,
  title,
  currentXp,
  xpToNext,
  showProgress = false,
  size = 'md',
  onClick,
}: LevelBadgeProps) {
  const badgeColor = getLevelBadgeColor(title);

  // Size configurations
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Calculate progress percentage
  const progressPercentage =
    currentXp && xpToNext
      ? Math.min(
          100,
          ((currentXp - (currentXp - xpToNext)) / (currentXp + xpToNext)) *
            100
        )
      : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`inline-flex flex-col ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Badge */}
      <div
        className={`
        ${badgeColor}
        ${sizeClasses[size]}
        rounded-full
        font-bold
        text-white
        shadow-md
        flex items-center gap-2
        transition-all
        hover:shadow-lg
      `}
      >
        {title === 'Legendary' ? (
          <Sparkles className={iconSizes[size]} />
        ) : (
          <Zap className={iconSizes[size]} fill="currentColor" />
        )}
        <span>Lv {level}</span>
        {size !== 'sm' && (
          <span className="opacity-80 font-normal">• {title}</span>
        )}
      </div>

      {/* XP Progress bar */}
      {showProgress && currentXp !== undefined && xpToNext !== undefined && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>
              {currentXp.toLocaleString()} / {(currentXp + xpToNext).toLocaleString()} XP
            </span>
            <span>{xpToNext.toLocaleString()} to next</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full ${badgeColor} rounded-full`}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
