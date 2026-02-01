/**
 * OneRepMaxCalculator Component
 *
 * Calculates estimated 1RM using the Epley formula
 * Provides testing protocol and percentage-based recommendations
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';

interface OneRepMaxCalculatorProps {
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  defaultWeight?: number;
  defaultReps?: number;
}

export default function OneRepMaxCalculator({
  isOpen = false,
  onToggle,
  defaultWeight = 100,
  defaultReps = 5,
}: OneRepMaxCalculatorProps) {
  const [expanded, setExpanded] = useState(isOpen);
  const [weight, setWeight] = useState(defaultWeight);
  const [reps, setReps] = useState(defaultReps);
  const [showTestProtocol, setShowTestProtocol] = useState(false);

  const handleToggle = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  // Epley Formula: 1RM = weight × (1 + reps/30)
  const calculateOneRepMax = (): number => {
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
  };

  // Brzycki Formula (alternative): 1RM = weight × (36 / (37 - reps))
  const calculateBrzycki = (): number => {
    if (reps === 1) return weight;
    if (reps >= 37) return weight; // Formula breaks down above 36 reps
    return weight * (36 / (37 - reps));
  };

  // Calculate percentage-based recommendations
  const oneRepMax = calculateOneRepMax();
  const brzycki = calculateBrzycki();
  const averageEstimate = (oneRepMax + brzycki) / 2;

  const percentages = [
    { percent: 90, purpose: 'Heavy Singles (Peaking)', reps: '1-2' },
    { percent: 85, purpose: 'Strength (High Load)', reps: '2-4' },
    { percent: 80, purpose: 'Strength Building', reps: '4-6' },
    { percent: 75, purpose: 'Hypertrophy/Strength', reps: '6-8' },
    { percent: 70, purpose: 'Hypertrophy', reps: '8-10' },
    { percent: 65, purpose: 'Volume/Endurance', reps: '10-12' },
  ];

  const testProtocolSteps = [
    { step: 1, description: 'Warm up: 5-10 min cardio + dynamic stretching' },
    { step: 2, description: `Light set: 40% of estimated 1RM (${(averageEstimate * 0.4).toFixed(1)}kg) × 8 reps` },
    { step: 3, description: `Medium set: 60% of estimated 1RM (${(averageEstimate * 0.6).toFixed(1)}kg) × 5 reps` },
    { step: 4, description: `Heavy set: 80% of estimated 1RM (${(averageEstimate * 0.8).toFixed(1)}kg) × 3 reps` },
    { step: 5, description: `Attempt: 90% of estimated 1RM (${(averageEstimate * 0.9).toFixed(1)}kg) × 1 rep` },
    { step: 6, description: 'If successful, add 2.5-5kg and attempt again after 3-5 min rest' },
    { step: 7, description: 'Continue until you reach your true 1RM (technical failure)' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={handleToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Trophy className="w-6 h-6 text-amber-600" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900">1RM Calculator</h3>
            <p className="text-sm text-gray-600">Estimate your one-rep max</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {expanded && oneRepMax > 0 && (
            <div className="text-right mr-2">
              <p className="text-xs text-gray-600">Estimated 1RM</p>
              <p className="text-lg font-bold text-amber-600">{averageEstimate.toFixed(1)}kg</p>
            </div>
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
            className="border-t border-gray-200"
          >
            <div className="p-5 space-y-4">
              {/* Input Fields */}
              <div className="grid grid-cols-2 gap-4">
                {/* Weight Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight Lifted (kg)
                  </label>
                  <input
                    type="number"
                    step="2.5"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                    className="w-full text-xl font-bold py-3 px-4 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  />
                </div>

                {/* Reps Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reps Achieved
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={reps}
                    onChange={(e) => setReps(parseInt(e.target.value) || 1)}
                    className="w-full text-xl font-bold py-3 px-4 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  />
                </div>
              </div>

              {/* 1RM Results */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-6 h-6 text-amber-600" />
                  <h4 className="font-bold text-gray-900">Estimated 1RM</h4>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center p-3 bg-white rounded-lg border border-amber-200">
                    <p className="text-xs text-gray-600 mb-1">Epley Formula</p>
                    <p className="text-2xl font-bold text-amber-600">{oneRepMax.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">kg</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-amber-200">
                    <p className="text-xs text-gray-600 mb-1">Brzycki Formula</p>
                    <p className="text-2xl font-bold text-amber-600">{brzycki.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">kg</p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-lg shadow-lg">
                    <p className="text-xs mb-1 opacity-90">Average</p>
                    <p className="text-2xl font-bold">{averageEstimate.toFixed(1)}</p>
                    <p className="text-xs opacity-90">kg</p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 text-center">
                  Based on {weight}kg × {reps} reps
                </p>
              </div>

              {/* Training Percentages */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-gray-900">Training Percentages</h4>
                </div>

                <div className="space-y-2">
                  {percentages.map((item, idx) => {
                    const targetWeight = averageEstimate * (item.percent / 100);
                    return (
                      <motion.div
                        key={item.percent}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-lg font-bold text-blue-600">{item.percent}%</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{item.purpose}</p>
                              <p className="text-xs text-gray-600">{item.reps} reps per set</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{targetWeight.toFixed(1)}</p>
                            <p className="text-xs text-gray-500">kg</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Test 1RM Protocol */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowTestProtocol(!showTestProtocol)}
                  className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 border-2 border-red-200 rounded-lg transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-red-600" />
                    <span className="font-bold text-gray-900">Test 1RM Protocol</span>
                  </div>
                  {showTestProtocol ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                <AnimatePresence>
                  {showTestProtocol && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 space-y-2"
                    >
                      {testProtocolSteps.map((item, idx) => (
                        <motion.div
                          key={item.step}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                        >
                          <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {item.step}
                          </div>
                          <p className="text-sm text-gray-700 flex-1 mt-1">{item.description}</p>
                        </motion.div>
                      ))}

                      <div className="mt-3 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                        <p className="text-xs text-yellow-900 font-semibold mb-1">⚠️ Safety First!</p>
                        <p className="text-xs text-yellow-800">
                          Always test your 1RM with a spotter. Use proper form and stop if you feel pain or
                          discomfort. This is an advanced technique - ensure you have proper training
                          experience before attempting.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
