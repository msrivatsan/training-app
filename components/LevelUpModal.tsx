'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Zap, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { LevelTier } from '@/lib/gamification/types';
import { getLevelBadgeColor } from '@/lib/gamification/xp-utils';

interface LevelUpModalProps {
  show: boolean;
  onClose: () => void;
  previousLevel: number;
  newLevel: number;
  title: LevelTier;
  totalXp: number;
}

export default function LevelUpModal({
  show,
  onClose,
  previousLevel,
  newLevel,
  title,
  totalXp,
}: LevelUpModalProps) {
  const badgeColor = getLevelBadgeColor(title);

  useEffect(() => {
    if (show) {
      // Trigger confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981'],
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 rounded-2xl shadow-2xl max-w-lg w-full p-8 border-2 border-purple-400"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Sparkles */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-yellow-400"
                  initial={{
                    x: Math.random() * 100 + '%',
                    y: '100%',
                    opacity: 0,
                  }}
                  animate={{
                    y: [null, '-20%'],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                >
                  ✨
                </motion.div>
              ))}
            </div>

            {/* Content */}
            <div className="relative text-center text-white">
              {/* Trophy icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2,
                }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-400 text-purple-900 mb-4"
              >
                <Trophy className="w-12 h-12" strokeWidth={2.5} />
              </motion.div>

              {/* Level up text */}
              <motion.h2
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold mb-2"
              >
                LEVEL UP!
              </motion.h2>

              {/* Level numbers */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="flex items-center justify-center gap-4 mb-4"
              >
                <span className="text-5xl font-bold text-purple-300">
                  {previousLevel}
                </span>
                <Zap className="w-8 h-8 text-yellow-400" fill="currentColor" />
                <span className="text-6xl font-bold text-yellow-400">
                  {newLevel}
                </span>
              </motion.div>

              {/* Title badge */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={`inline-block px-6 py-3 rounded-full ${badgeColor} text-white font-bold text-lg mb-6`}
              >
                <Sparkles className="w-5 h-5 inline mr-2" />
                {title}
              </motion.div>

              {/* Total XP */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-6"
              >
                <p className="text-purple-200 mb-1">Total Experience</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {totalXp.toLocaleString()} XP
                </p>
              </motion.div>

              {/* Motivational message */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="p-4 rounded-lg bg-white/10 backdrop-blur-sm"
              >
                <p className="text-sm text-purple-100">
                  {getMotivationalMessage(newLevel)}
                </p>
              </motion.div>

              {/* Continue button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={onClose}
                className="mt-6 px-8 py-3 bg-yellow-400 text-purple-900 font-bold rounded-full hover:bg-yellow-300 transition-colors shadow-lg"
              >
                Continue Training
              </motion.button>
            </div>

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-yellow-400/20 to-transparent pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function getMotivationalMessage(level: number): string {
  if (level <= 5) {
    return "You're building a solid foundation. Keep pushing!";
  } else if (level <= 10) {
    return 'Your dedication is showing results. Stay consistent!';
  } else if (level <= 20) {
    return "You've unlocked intermediate status. The iron path awaits!";
  } else if (level <= 30) {
    return 'Advanced strength achieved. Your hard work is paying off!';
  } else if (level <= 50) {
    return 'Elite performance unlocked. Few reach this level!';
  } else if (level <= 60) {
    return "You're among the strongest. Keep dominating!";
  } else {
    return 'LEGENDARY STATUS! Your name will be remembered in the iron halls!';
  }
}
