/**
 * PRConfetti Component
 *
 * Celebratory confetti animation for personal records
 */

'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface PRConfettiProps {
  trigger: boolean;
  exerciseName?: string;
  weight?: number;
  reps?: number;
  onComplete?: () => void;
}

export default function PRConfetti({
  trigger,
  exerciseName,
  weight,
  reps,
  onComplete,
}: PRConfettiProps) {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (trigger && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      firePRConfetti();

      // Reset after animation
      setTimeout(() => {
        hasTriggeredRef.current = false;
        onComplete?.();
      }, 5000);
    }
  }, [trigger, onComplete]);

  const firePRConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    // Fire multiple bursts
    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Gold confetti from left
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
      });

      // Gold confetti from right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
      });
    }, 250);

    // Big burst at the start
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347', '#FFE66D'],
    });

    // Firework bursts
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#FF6347'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#FF6347'],
      });
    }, 200);
  };

  if (!trigger) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
        }}
        className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-3xl p-8 shadow-2xl text-white max-w-md mx-4"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 1,
          }}
          className="flex justify-center mb-4"
        >
          <div className="bg-white rounded-full p-6">
            <Trophy className="w-16 h-16 text-amber-500" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold text-center mb-2"
        >
          🎉 PERSONAL RECORD! 🎉
        </motion.h2>

        {exerciseName && (
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-semibold text-center mb-4"
          >
            {exerciseName}
          </motion.p>
        )}

        {weight && reps && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center bg-white/20 backdrop-blur-sm rounded-xl p-4"
          >
            <p className="text-3xl font-bold">
              {weight}kg × {reps} reps
            </p>
          </motion.div>
        )}

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-4 text-sm opacity-90"
        >
          You're getting stronger! Keep crushing it! 💪
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
