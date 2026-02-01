/**
 * WarmupProtocolDisplay Component
 *
 * Auto-generates and displays warmup sets based on working weight
 * Shows as interactive checklist before main sets
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface WarmupSet {
  setNumber: number;
  weight: number;
  reps: number;
  percentage: number;
  description: string;
}

interface WarmupProtocolDisplayProps {
  workingWeight: number;
  isCompound?: boolean;
  barWeight?: number;
  onComplete?: (warmupSets: WarmupSet[]) => void;
  onSkip?: () => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export default function WarmupProtocolDisplay({
  workingWeight,
  isCompound = true,
  barWeight = 20,
  onComplete,
  onSkip,
  isOpen = true,
  onToggle,
}: WarmupProtocolDisplayProps) {
  const [expanded, setExpanded] = useState(isOpen);
  const [completedSets, setCompletedSets] = useState<Set<number>>(new Set());
  const [skipped, setSkipped] = useState(false);

  const handleToggle = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  // Generate warmup protocol based on working weight
  const generateWarmupSets = (): WarmupSet[] => {
    if (workingWeight <= barWeight) return [];

    const warmupSets: WarmupSet[] = [];

    if (isCompound) {
      // Compound lift warmup (more gradual progression)
      warmupSets.push({
        setNumber: 1,
        weight: barWeight,
        reps: 10,
        percentage: 0,
        description: 'Empty bar - Focus on form',
      });

      const fiftyPercent = workingWeight * 0.5;
      if (fiftyPercent > barWeight) {
        warmupSets.push({
          setNumber: 2,
          weight: Math.round(fiftyPercent / 2.5) * 2.5,
          reps: 8,
          percentage: 50,
          description: 'Light weight - Grease the groove',
        });
      }

      const seventyPercent = workingWeight * 0.7;
      if (seventyPercent > barWeight) {
        warmupSets.push({
          setNumber: 3,
          weight: Math.round(seventyPercent / 2.5) * 2.5,
          reps: 5,
          percentage: 70,
          description: 'Medium weight - Build activation',
        });
      }

      const eightyFivePercent = workingWeight * 0.85;
      if (eightyFivePercent > barWeight && workingWeight >= 60) {
        warmupSets.push({
          setNumber: 4,
          weight: Math.round(eightyFivePercent / 2.5) * 2.5,
          reps: 3,
          percentage: 85,
          description: 'Heavy - Prime nervous system',
        });
      }
    } else {
      // Accessory warmup (simpler protocol)
      const fortyPercent = workingWeight * 0.4;
      if (fortyPercent >= barWeight) {
        warmupSets.push({
          setNumber: 1,
          weight: Math.round(fortyPercent / 2.5) * 2.5,
          reps: 12,
          percentage: 40,
          description: 'Light warmup set',
        });
      }

      const sixtyPercent = workingWeight * 0.6;
      if (sixtyPercent > barWeight) {
        warmupSets.push({
          setNumber: 2,
          weight: Math.round(sixtyPercent / 2.5) * 2.5,
          reps: 10,
          percentage: 60,
          description: 'Medium warmup set',
        });
      }
    }

    return warmupSets;
  };

  const warmupSets = generateWarmupSets();
  const allSetsCompleted = warmupSets.length > 0 && warmupSets.every((set) => completedSets.has(set.setNumber));

  const handleSetComplete = (setNumber: number) => {
    const newCompleted = new Set(completedSets);
    if (newCompleted.has(setNumber)) {
      newCompleted.delete(setNumber);
    } else {
      newCompleted.add(setNumber);
    }
    setCompletedSets(newCompleted);

    // Trigger haptic feedback
    if ('vibrate' in navigator && !completedSets.has(setNumber)) {
      navigator.vibrate(30);
    }

    // If all sets completed, call onComplete
    if (warmupSets.every((set) => newCompleted.has(set.setNumber))) {
      onComplete?.(warmupSets);
    }
  };

  const handleSkipWarmup = () => {
    setSkipped(true);
    onSkip?.();
  };

  if (skipped) {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 1 }}
        className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4"
      >
        <p className="text-sm text-orange-800 text-center">
          ⚠️ Warmup skipped - Be careful with heavy weights!
        </p>
      </motion.div>
    );
  }

  if (warmupSets.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-md border-2 border-orange-200 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={handleToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-orange-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900">Warmup Protocol</h3>
            <p className="text-sm text-gray-600">
              {allSetsCompleted
                ? '✓ Warmup complete - Ready to lift!'
                : `${completedSets.size}/${warmupSets.length} sets completed`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allSetsCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
            >
              <Check className="w-5 h-5 text-white" />
            </motion.div>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-orange-200"
          >
            <div className="p-5 space-y-4">
              {/* Working Weight Info */}
              <div className="bg-white rounded-lg p-3 border border-orange-200">
                <p className="text-xs text-gray-600 mb-1">Working Weight</p>
                <p className="text-2xl font-bold text-orange-600">{workingWeight}kg</p>
              </div>

              {/* Warmup Sets Checklist */}
              <div className="space-y-2">
                {warmupSets.map((set, idx) => {
                  const isCompleted = completedSets.has(set.setNumber);
                  return (
                    <motion.button
                      key={set.setNumber}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => handleSetComplete(set.setNumber)}
                      className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        isCompleted
                          ? 'bg-green-50 border-green-500 shadow-md'
                          : 'bg-white border-gray-300 hover:border-orange-400 hover:shadow-md'
                      }`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isCompleted
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-400 hover:border-orange-500'
                        }`}
                      >
                        {isCompleted && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <Check className="w-5 h-5 text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </div>

                      {/* Set Info */}
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`font-bold ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>
                            Warmup Set {set.setNumber}
                            {set.percentage > 0 && (
                              <span className="ml-2 text-sm font-normal text-gray-600">
                                ({set.percentage}%)
                              </span>
                            )}
                          </p>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${isCompleted ? 'text-green-700' : 'text-orange-600'}`}>
                              {set.weight}kg
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">{set.description}</p>
                          <p className={`text-sm font-semibold ${isCompleted ? 'text-green-700' : 'text-gray-700'}`}>
                            {set.reps} reps
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Completion Message */}
              <AnimatePresence>
                {allSetsCompleted && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg p-4 text-center"
                  >
                    <Check className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-bold text-lg">Warmup Complete!</p>
                    <p className="text-sm opacity-90">You're primed and ready for your working sets 💪</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Skip Option */}
              {!allSetsCompleted && (
                <div className="pt-3 border-t border-orange-200">
                  <button
                    onClick={handleSkipWarmup}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-white border-2 border-orange-300 hover:border-orange-400 rounded-lg text-orange-700 font-medium transition-all"
                  >
                    <AlertCircle className="w-5 h-5" />
                    <span>Skip Warmup (Not Recommended)</span>
                  </button>
                  <p className="text-xs text-center text-gray-600 mt-2">
                    Skipping warmup increases injury risk and reduces performance
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
