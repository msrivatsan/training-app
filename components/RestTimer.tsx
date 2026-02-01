/**
 * Advanced RestTimer Component
 *
 * Features:
 * - Auto-start after set completion
 * - Circular progress ring with visual countdown
 * - 10-second warning with color change and haptic feedback
 * - Customizable audio alerts
 * - Skip/Add time buttons (+30s, -30s)
 * - Pause/Resume functionality
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Pause, Play, Plus, Minus, SkipForward } from 'lucide-react';

interface RestTimerProps {
  isActive: boolean;
  timeRemaining: number;
  totalTime: number;
  onSkip: () => void;
  onTimeAdjust: (newTime: number) => void;
  onPause: () => void;
  onResume: () => void;
  isPaused?: boolean;
  soundEnabled?: boolean;
  soundUrl?: string;
}

export default function RestTimer({
  isActive,
  timeRemaining,
  totalTime,
  onSkip,
  onTimeAdjust,
  onPause,
  onResume,
  isPaused = false,
  soundEnabled = true,
  soundUrl = '/sounds/timer-complete.mp3',
}: RestTimerProps) {
  const [warningTriggered, setWarningTriggered] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousTimeRef = useRef(timeRemaining);

  // Initialize audio element
  useEffect(() => {
    if (soundEnabled) {
      audioRef.current = new Audio(soundUrl);
      audioRef.current.volume = 0.7;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [soundEnabled, soundUrl]);

  // Handle warning at 10 seconds
  useEffect(() => {
    if (timeRemaining === 10 && previousTimeRef.current > 10 && !warningTriggered) {
      setWarningTriggered(true);

      // Haptic feedback (3 short bursts)
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 100]);
      }
    }

    // Reset warning when timer restarts
    if (timeRemaining > 10) {
      setWarningTriggered(false);
    }

    previousTimeRef.current = timeRemaining;
  }, [timeRemaining, warningTriggered]);

  // Play sound when timer completes
  useEffect(() => {
    if (timeRemaining === 0 && previousTimeRef.current > 0 && soundEnabled) {
      audioRef.current?.play().catch(() => {
        console.log('Audio playback failed - user interaction may be required');
      });
    }
  }, [timeRemaining, soundEnabled]);

  const handleAddTime = () => {
    onTimeAdjust(Math.min(totalTime + 30, timeRemaining + 30));
  };

  const handleSubtractTime = () => {
    onTimeAdjust(Math.max(0, timeRemaining - 30));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;
  const isWarning = timeRemaining <= 10 && timeRemaining > 0;
  const isComplete = timeRemaining === 0;

  // Circle SVG properties
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`${
            isComplete
              ? 'bg-gradient-to-r from-green-500 to-green-600'
              : isWarning
              ? 'bg-gradient-to-r from-orange-500 to-red-500 animate-pulse'
              : 'bg-gradient-to-r from-blue-500 to-blue-600'
          } text-white px-4 py-6 shadow-2xl`}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              {/* Left Section - Icon and Label */}
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Timer className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-bold text-lg">Rest Timer</p>
                  <p className={`text-sm ${isWarning ? 'font-semibold animate-pulse' : 'opacity-90'}`}>
                    {isComplete
                      ? '🎉 Rest complete! Ready for next set'
                      : isWarning
                      ? '⚠️ Get ready to lift!'
                      : isPaused
                      ? 'Paused - Resume when ready'
                      : 'Take a break between sets'}
                  </p>
                </div>
              </div>

              {/* Center Section - Circular Progress & Time */}
              <div className="relative flex items-center justify-center">
                {/* Circular Progress Ring */}
                <svg className="transform -rotate-90" width="140" height="140">
                  {/* Background circle */}
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke={isComplete ? '#10b981' : isWarning ? '#fbbf24' : 'white'}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  />
                </svg>

                {/* Time Display in Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.p
                    key={timeRemaining}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`font-mono font-bold ${
                      isWarning ? 'text-5xl text-yellow-300' : 'text-4xl'
                    }`}
                  >
                    {formatTime(timeRemaining)}
                  </motion.p>
                  <p className="text-xs opacity-75 mt-1">
                    {isPaused ? 'PAUSED' : isComplete ? 'DONE' : 'remaining'}
                  </p>
                </div>
              </div>

              {/* Right Section - Controls */}
              <div className="flex flex-col gap-2">
                {/* Time Adjustment Buttons */}
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={handleSubtractTime}
                    disabled={timeRemaining <= 0}
                    className="p-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all hover:scale-105 backdrop-blur-sm"
                    title="Subtract 30 seconds"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleAddTime}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all hover:scale-105 backdrop-blur-sm"
                    title="Add 30 seconds"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Pause/Resume and Skip Buttons */}
                <div className="flex gap-2">
                  {!isComplete && (
                    <button
                      onClick={isPaused ? onResume : onPause}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-all hover:scale-105 backdrop-blur-sm"
                    >
                      {isPaused ? (
                        <>
                          <Play className="w-5 h-5" />
                          <span>Resume</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-5 h-5" />
                          <span>Pause</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={onSkip}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 hover:bg-gray-100 rounded-lg font-semibold transition-all hover:scale-105 shadow-lg"
                  >
                    <SkipForward className="w-5 h-5" />
                    <span>Skip</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Bar (Linear) */}
            <div className="mt-4 w-full bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
              <motion.div
                className={`h-full ${
                  isComplete ? 'bg-green-400' : isWarning ? 'bg-yellow-300' : 'bg-white'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
