'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import * as LucideIcons from 'lucide-react';
import { Achievement } from '@/lib/gamification/types';
import { getAchievementTierColor } from '@/lib/gamification/xp-utils';

interface AchievementToastProps {
  achievement: Achievement;
  show: boolean;
  onClose: () => void;
  xpEarned?: number;
}

export default function AchievementToast({
  achievement,
  show,
  onClose,
  xpEarned,
}: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);

    if (show) {
      // Trigger confetti for legendary achievements
      if (achievement.tier === 'legendary') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.2, x: 0.95 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#9333ea'],
        });
      }

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose, achievement.tier]);

  // Get icon component
  const IconComponent = achievement.icon
    ? (LucideIcons[achievement.icon as keyof typeof LucideIcons] as any)
    : LucideIcons.Award;

  const tierColor = getAchievementTierColor(achievement.tier);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-4 right-4 z-50 max-w-md"
        >
          <div
            className={`rounded-lg border-2 shadow-2xl p-4 ${tierColor} backdrop-blur-sm`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 15,
                  delay: 0.2,
                }}
                className="flex-shrink-0"
              >
                {IconComponent && (
                  <IconComponent className="w-10 h-10" strokeWidth={2} />
                )}
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold uppercase tracking-wider">
                      Achievement Unlocked!
                    </p>
                    {achievement.tier === 'legendary' && (
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        ✨
                      </motion.span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold mb-1">
                    {achievement.name}
                  </h3>

                  <p className="text-sm opacity-90 mb-2">
                    {achievement.description}
                  </p>

                  {/* XP Reward */}
                  {xpEarned && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: 'spring' }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-sm font-bold"
                    >
                      <LucideIcons.Zap className="w-4 h-4" />
                      +{xpEarned} XP
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Close button */}
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
              >
                <LucideIcons.X className="w-5 h-5" />
              </button>
            </div>

            {/* Tier badge */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-3 pt-3 border-t border-current/20"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="uppercase tracking-wider">
                  {achievement.tier} Tier
                </span>
                <span className="opacity-70">{achievement.category}</span>
              </div>
            </motion.div>
          </div>

          {/* Sparkle effects for legendary achievements */}
          {achievement.tier === 'legendary' && (
            <>
              <motion.div
                className="absolute -top-2 -left-2 text-yellow-400"
                animate={{
                  scale: [0, 1, 0],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                }}
              >
                ✨
              </motion.div>
              <motion.div
                className="absolute -bottom-2 -right-2 text-yellow-400"
                animate={{
                  scale: [0, 1, 0],
                  rotate: [0, -180, -360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              >
                ✨
              </motion.div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
