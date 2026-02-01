/**
 * SetCard Component
 *
 * Interactive card for tracking individual sets with weight and reps input
 */

'use client';

import { useState, useEffect } from 'react';
import { Check, Minus, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';

export type SetStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

interface SetCardProps {
  setNumber: number;
  targetReps: number;
  targetWeight?: number;
  suggestedWeight?: number;
  previousWeight?: number;
  previousReps?: number;
  status: SetStatus;
  completedReps?: number;
  completedWeight?: number;
  completedRpe?: number;
  onComplete: (weight: number, reps: number, rpe?: number) => void;
  onFail?: () => void;
  isWarmup?: boolean;
  enableRpe?: boolean;
}

export default function SetCard({
  setNumber,
  targetReps,
  targetWeight,
  suggestedWeight,
  previousWeight,
  previousReps,
  status,
  completedReps,
  completedWeight,
  completedRpe,
  onComplete,
  onFail,
  isWarmup = false,
  enableRpe = true,
}: SetCardProps) {
  const [weight, setWeight] = useState(suggestedWeight || targetWeight || previousWeight || 0);
  const [reps, setReps] = useState(targetReps);
  const [rpe, setRpe] = useState<number | null>(completedRpe || null);
  const [showRpeInput, setShowRpeInput] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (status === 'completed' && completedWeight && completedReps) {
      setWeight(completedWeight);
      setReps(completedReps);
    }
  }, [status, completedWeight, completedReps]);

  const handleComplete = () => {
    // Trigger haptic feedback (if supported)
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Show RPE input if enabled and not warmup
    if (enableRpe && !isWarmup) {
      setShowRpeInput(true);
    } else {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1000);
      onComplete(weight, reps);
    }
  };

  const handleRpeComplete = (selectedRpe: number) => {
    setRpe(selectedRpe);
    setShowRpeInput(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1000);
    onComplete(weight, reps, selectedRpe);
  };

  const handleSkipRpe = () => {
    setShowRpeInput(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1000);
    onComplete(weight, reps);
  };

  const handleFail = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
    onFail?.();
  };

  const adjustWeight = (delta: number) => {
    setWeight(Math.max(0, weight + delta));
  };

  const adjustReps = (delta: number) => {
    setReps(Math.max(0, reps + delta));
  };

  const isDisabled = status === 'completed' || status === 'failed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-xl p-5 border-2 transition-all duration-200 ${
        status === 'completed'
          ? 'bg-green-50 border-green-500'
          : status === 'failed'
          ? 'bg-red-50 border-red-500'
          : status === 'in-progress'
          ? 'bg-purple-50 border-purple-500 shadow-lg'
          : 'bg-white border-gray-200 hover:border-purple-300'
      }`}
    >
      {/* Success Animation Overlay */}
      {showSuccess && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-xl backdrop-blur-sm z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="bg-green-500 rounded-full p-4"
          >
            <Check className="w-12 h-12 text-white" strokeWidth={3} />
          </motion.div>
        </motion.div>
      )}

      {/* Set Number Badge */}
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
            status === 'completed'
              ? 'bg-green-500 text-white'
              : status === 'failed'
              ? 'bg-red-500 text-white'
              : status === 'in-progress'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {status === 'completed' ? (
            <Check className="w-6 h-6" />
          ) : status === 'failed' ? (
            <X className="w-6 h-6" />
          ) : (
            setNumber
          )}
        </div>

        {/* Warmup Badge */}
        {isWarmup && (
          <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-1 rounded">
            Warmup
          </span>
        )}

        {/* Target Display */}
        {!isWarmup && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Target</p>
            <p className="text-sm font-semibold text-gray-900">
              {targetReps} reps {targetWeight ? `@ ${targetWeight}kg` : ''}
            </p>
          </div>
        )}
      </div>

      {/* Previous Session Info */}
      {previousWeight && previousReps && status === 'pending' && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-600 font-medium">
            Last time: {previousReps} reps @ {previousWeight}kg
          </p>
        </div>
      )}

      {/* Weight Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => adjustWeight(-2.5)}
            disabled={isDisabled}
            className={`p-2 rounded-lg ${
              isDisabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <Minus className="w-5 h-5" />
          </button>

          <input
            type="number"
            step="2.5"
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
            disabled={isDisabled}
            className={`flex-1 text-center text-2xl font-bold py-3 px-4 border-2 rounded-lg ${
              isDisabled
                ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                : 'border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
            }`}
          />

          <button
            onClick={() => adjustWeight(2.5)}
            disabled={isDisabled}
            className={`p-2 rounded-lg ${
              isDisabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Suggested Weight Hint */}
        {suggestedWeight && suggestedWeight !== weight && status !== 'completed' && (
          <button
            onClick={() => setWeight(suggestedWeight)}
            className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium"
          >
            Use suggested: {suggestedWeight}kg
          </button>
        )}
      </div>

      {/* Reps Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Reps Achieved</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => adjustReps(-1)}
            disabled={isDisabled}
            className={`p-2 rounded-lg ${
              isDisabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <Minus className="w-5 h-5" />
          </button>

          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(parseInt(e.target.value) || 0)}
            disabled={isDisabled}
            className={`flex-1 text-center text-2xl font-bold py-3 px-4 border-2 rounded-lg ${
              isDisabled
                ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                : 'border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
            }`}
          />

          <button
            onClick={() => adjustReps(1)}
            disabled={isDisabled}
            className={`p-2 rounded-lg ${
              isDisabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      {status !== 'completed' && status !== 'failed' && (
        <div className="flex gap-2">
          <button
            onClick={handleComplete}
            disabled={weight === 0 && reps === 0}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Complete Set
          </button>

          {onFail && (
            <button
              onClick={handleFail}
              className="px-4 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* RPE Input Modal */}
      {showRpeInput && (
        <div className="mb-4 p-4 bg-indigo-50 rounded-lg border-2 border-indigo-300">
          <p className="text-sm font-semibold text-gray-900 mb-3">
            How hard was that set? (Optional)
          </p>

          <div className="grid grid-cols-5 gap-2 mb-3">
            {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((rpeValue) => (
              <button
                key={rpeValue}
                onClick={() => handleRpeComplete(rpeValue)}
                className={`py-2 px-1 rounded-lg font-semibold text-sm transition-all hover:scale-105 ${
                  getRpeButtonColor(rpeValue)
                }`}
              >
                {rpeValue}
              </button>
            ))}
          </div>

          <button
            onClick={handleSkipRpe}
            className="w-full text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip RPE
          </button>
        </div>
      )}

      {/* Completed Info */}
      {status === 'completed' && (
        <div className="text-center p-3 bg-green-100 rounded-lg">
          <p className="text-sm font-semibold text-green-800">
            ✓ {completedReps || reps} reps @ {completedWeight || weight}kg
            {completedRpe && <span className="ml-2">• RPE {completedRpe}</span>}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function getRpeButtonColor(rpe: number): string {
  if (rpe >= 9.5) return 'bg-red-500 text-white hover:bg-red-600';
  if (rpe >= 9) return 'bg-orange-500 text-white hover:bg-orange-600';
  if (rpe >= 8) return 'bg-yellow-500 text-white hover:bg-yellow-600';
  if (rpe >= 7) return 'bg-green-500 text-white hover:bg-green-600';
  return 'bg-blue-500 text-white hover:bg-blue-600';
}
