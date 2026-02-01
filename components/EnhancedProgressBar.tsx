/**
 * EnhancedProgressBar Component
 *
 * Smooth animated progress bar with customizable styles and effects
 */

'use client';

import { motion } from 'framer-motion';

interface EnhancedProgressBarProps {
  value: number; // 0-100
  max?: number;
  height?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'purple' | 'blue' | 'green' | 'amber' | 'red' | 'gradient';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  striped?: boolean;
  glow?: boolean;
  className?: string;
}

export default function EnhancedProgressBar({
  value,
  max = 100,
  height = 'md',
  color = 'purple',
  showLabel = false,
  label,
  animated = true,
  striped = false,
  glow = false,
  className = '',
}: EnhancedProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
    xl: 'h-6',
  };

  const colorClasses = {
    purple: 'bg-purple-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    amber: 'bg-amber-600',
    red: 'bg-red-600',
    gradient: 'bg-gradient-to-r from-purple-600 via-pink-600 to-red-600',
  };

  const glowClasses = {
    purple: 'shadow-lg shadow-purple-500/50',
    blue: 'shadow-lg shadow-blue-500/50',
    green: 'shadow-lg shadow-green-500/50',
    amber: 'shadow-lg shadow-amber-500/50',
    red: 'shadow-lg shadow-red-500/50',
    gradient: 'shadow-lg shadow-pink-500/50',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {label || 'Progress'}
          </span>
          <span className="text-sm font-bold text-gray-900">
            {Math.round(percentage)}%
          </span>
        </div>
      )}

      <div
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClasses[height]}`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: animated ? 0.8 : 0,
            ease: 'easeOut',
          }}
          className={`${heightClasses[height]} ${colorClasses[color]} ${
            glow ? glowClasses[color] : ''
          } rounded-full relative ${striped ? 'striped-progress' : ''}`}
        >
          {striped && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </motion.div>
      </div>

      <style jsx>{`
        .striped-progress {
          background-image: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.15) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.15) 50%,
            rgba(255, 255, 255, 0.15) 75%,
            transparent 75%,
            transparent
          );
          background-size: 1rem 1rem;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
