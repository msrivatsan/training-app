/**
 * ActiveWorkout Component
 *
 * Main workout interface with exercise tracking, set management, and rest timer
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Timer, Dumbbell, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import SetCard, { SetStatus } from './SetCard';
import { calculateWeightSuggestion } from '@/lib/progression';
import type { Exercise, Set } from '@/lib/types';

interface ActiveWorkoutProps {
  sessionId: string;
  workoutId: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface ExerciseWithSets extends Exercise {
  completedSets: Set[];
  previousSets?: Set[];
}

interface RestTimerState {
  isActive: boolean;
  timeRemaining: number;
  totalTime: number;
}

export default function ActiveWorkout({
  sessionId,
  workoutId,
  onComplete,
  onCancel,
}: ActiveWorkoutProps) {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<ExerciseWithSets[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [workoutType, setWorkoutType] = useState<'strength' | 'hypertrophy' | 'mixed' | 'deload'>('mixed');
  const [restTimer, setRestTimer] = useState<RestTimerState>({
    isActive: false,
    timeRemaining: 0,
    totalTime: 0,
  });
  const [setStates, setSetStates] = useState<Record<number, SetStatus>>({});
  const supabase = createClient();

  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;

  // Fetch exercises and previous session data
  useEffect(() => {
    if (!user) return;

    const fetchWorkoutData = async () => {
      setLoading(true);

      // Get workout info to determine type
      const { data: workoutData } = await supabase
        .from('workouts')
        .select('workout_type')
        .eq('id', workoutId)
        .single();

      if (workoutData) {
        setWorkoutType(workoutData.workout_type);
      }

      // Get exercises for this workout
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .eq('workout_id', workoutId)
        .order('order_index', { ascending: true });

      if (exercisesError) {
        console.error('Error fetching exercises:', exercisesError);
        setLoading(false);
        return;
      }

      // Get completed sets for this session
      const { data: completedSets } = await supabase
        .from('sets')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      // Get previous session for this workout
      const { data: previousSession } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('workout_id', workoutId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      // Get previous sets if previous session exists
      let previousSetsMap: Record<string, Set[]> = {};
      if (previousSession) {
        const { data: previousSets } = await supabase
          .from('sets')
          .select('*')
          .eq('session_id', previousSession.id)
          .order('set_number', { ascending: true });

        if (previousSets) {
          previousSetsMap = previousSets.reduce((acc, set) => {
            if (!acc[set.exercise_id]) {
              acc[set.exercise_id] = [];
            }
            acc[set.exercise_id].push(set);
            return acc;
          }, {} as Record<string, Set[]>);
        }
      }

      // Combine exercises with their sets
      const exercisesWithSets: ExerciseWithSets[] = (exercisesData || []).map((exercise) => ({
        ...exercise,
        completedSets: (completedSets || []).filter((set) => set.exercise_id === exercise.id),
        previousSets: previousSetsMap[exercise.id] || [],
      }));

      setExercises(exercisesWithSets);

      // Initialize set states
      const initialStates: Record<number, SetStatus> = {};
      exercisesWithSets.forEach((exercise) => {
        const targetSets = exercise.target_sets || 4;
        for (let i = 1; i <= targetSets; i++) {
          const isCompleted = exercise.completedSets.some((s) => s.set_number === i);
          initialStates[i] = isCompleted ? 'completed' : i === 1 ? 'in-progress' : 'pending';
        }
      });
      setSetStates(initialStates);

      setLoading(false);
    };

    fetchWorkoutData();
  }, [user, workoutId, sessionId, supabase]);

  // Rest timer countdown
  useEffect(() => {
    if (!restTimer.isActive) return;

    const interval = setInterval(() => {
      setRestTimer((prev) => {
        if (prev.timeRemaining <= 1) {
          // Timer finished - trigger notification
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
          // Play sound if available
          const audio = new Audio('/sounds/timer-complete.mp3');
          audio.play().catch(() => {}); // Ignore errors if sound file doesn't exist

          return { isActive: false, timeRemaining: 0, totalTime: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimer.isActive]);

  // Start rest timer after set completion
  const startRestTimer = (duration: number) => {
    setRestTimer({
      isActive: true,
      timeRemaining: duration,
      totalTime: duration,
    });
  };

  // Handle set completion
  const handleSetComplete = async (setNumber: number, weight: number, reps: number) => {
    if (!currentExercise) return;

    try {
      // Save set to database
      const { error } = await supabase.from('sets').insert({
        session_id: sessionId,
        exercise_id: currentExercise.id,
        set_number: setNumber,
        weight_kg: weight,
        reps: reps,
        is_warmup: false,
        is_drop_set: false,
      });

      if (error) throw error;

      // Update set state
      setSetStates((prev) => ({
        ...prev,
        [setNumber]: 'completed',
        [setNumber + 1]: 'in-progress',
      }));

      // Start rest timer
      const restDuration = currentExercise.rest_seconds || 120;
      startRestTimer(restDuration);

      // Update exercises with new completed set
      setExercises((prev) =>
        prev.map((ex, idx) =>
          idx === currentExerciseIndex
            ? {
                ...ex,
                completedSets: [
                  ...ex.completedSets,
                  {
                    id: crypto.randomUUID(),
                    session_id: sessionId,
                    exercise_id: ex.id,
                    set_number: setNumber,
                    weight_kg: weight,
                    reps: reps,
                    rpe: null,
                    rest_seconds: null,
                    notes: null,
                    is_warmup: false,
                    is_drop_set: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ],
              }
            : ex
        )
      );

      // Check if all sets are completed for this exercise
      const targetSets = currentExercise.target_sets || 4;
      if (setNumber >= targetSets) {
        // Auto-advance to next exercise after a short delay
        setTimeout(() => {
          if (currentExerciseIndex < totalExercises - 1) {
            handleNextExercise();
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving set:', error);
      alert('Failed to save set. Please try again.');
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);

      // Reset set states for new exercise
      const nextExercise = exercises[currentExerciseIndex + 1];
      const newStates: Record<number, SetStatus> = {};
      const targetSets = nextExercise.target_sets || 4;

      for (let i = 1; i <= targetSets; i++) {
        const isCompleted = nextExercise.completedSets.some((s) => s.set_number === i);
        newStates[i] = isCompleted ? 'completed' : i === 1 ? 'in-progress' : 'pending';
      }

      setSetStates(newStates);
      setRestTimer({ isActive: false, timeRemaining: 0, totalTime: 0 });
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);

      // Reset set states for previous exercise
      const prevExercise = exercises[currentExerciseIndex - 1];
      const newStates: Record<number, SetStatus> = {};
      const targetSets = prevExercise.target_sets || 4;

      for (let i = 1; i <= targetSets; i++) {
        const isCompleted = prevExercise.completedSets.some((s) => s.set_number === i);
        newStates[i] = isCompleted ? 'completed' : i === 1 ? 'in-progress' : 'pending';
      }

      setSetStates(newStates);
      setRestTimer({ isActive: false, timeRemaining: 0, totalTime: 0 });
    }
  };

  const calculateProgress = () => {
    const totalSets = exercises.reduce((sum, ex) => sum + (ex.target_sets || 4), 0);
    const completedSets = exercises.reduce((sum, ex) => sum + ex.completedSets.length, 0);
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!currentExercise) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">No exercises found for this workout.</p>
      </div>
    );
  }

  const targetSets = currentExercise.target_sets || 4;
  const completedSetsCount = currentExercise.completedSets.length;
  const allSetsCompleted = completedSetsCount >= targetSets;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Exercise {currentExerciseIndex + 1} of {totalExercises}
              </p>
              <p className="text-xs text-gray-500 mt-1">{calculateProgress()}% Complete</p>
            </div>

            <button
              onClick={onComplete}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Finish
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Rest Timer Banner */}
      <AnimatePresence>
        {restTimer.isActive && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-4"
          >
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Timer className="w-6 h-6" />
                <div>
                  <p className="font-semibold">Rest Timer</p>
                  <p className="text-sm text-blue-100">Take a break between sets</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{formatTime(restTimer.timeRemaining)}</p>
                <button
                  onClick={() => setRestTimer({ isActive: false, timeRemaining: 0, totalTime: 0 })}
                  className="text-sm text-blue-100 hover:text-white"
                >
                  Skip
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Exercise Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Dumbbell className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentExercise.name}</h1>
              {currentExercise.description && (
                <p className="text-gray-600 mb-3">{currentExercise.description}</p>
              )}

              {/* Target Info */}
              <div className="bg-purple-50 rounded-lg p-4 mb-3">
                <p className="text-sm text-gray-600 mb-1">Target</p>
                <p className="text-lg font-bold text-purple-900">
                  {currentExercise.target_sets} sets × {currentExercise.target_reps} reps
                  {currentExercise.target_weight_kg && ` @ ${currentExercise.target_weight_kg}kg`}
                </p>
              </div>

              {/* Previous Session Info */}
              {currentExercise.previousSets && currentExercise.previousSets.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium mb-2">Last Session</p>
                  <div className="grid grid-cols-4 gap-2">
                    {currentExercise.previousSets.slice(0, 4).map((set, idx) => (
                      <div key={idx} className="text-center">
                        <p className="text-xs text-blue-600">Set {set.set_number}</p>
                        <p className="text-sm font-semibold text-blue-900">
                          {set.reps}×{set.weight_kg}kg
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sets Grid */}
        <div className="space-y-4 mb-6">
          {Array.from({ length: targetSets }, (_, i) => i + 1).map((setNum) => {
            const completedSet = currentExercise.completedSets.find((s) => s.set_number === setNum);
            const previousSet = currentExercise.previousSets?.find((s) => s.set_number === setNum);

            // Calculate smart weight suggestion for first set
            let suggestedWeight: number | undefined;
            if (setNum === 1 && currentExercise.previousSets && currentExercise.previousSets.length > 0) {
              const suggestion = calculateWeightSuggestion(
                currentExercise.previousSets.map(s => ({
                  set_number: s.set_number,
                  weight_kg: s.weight_kg,
                  reps: s.reps,
                })),
                currentExercise.target_reps || 10,
                targetSets,
                workoutType
              );
              suggestedWeight = suggestion.suggestedWeight;
            }

            return (
              <SetCard
                key={setNum}
                setNumber={setNum}
                targetReps={currentExercise.target_reps || 10}
                targetWeight={currentExercise.target_weight_kg ?? undefined}
                suggestedWeight={suggestedWeight}
                previousWeight={previousSet?.weight_kg}
                previousReps={previousSet?.reps}
                status={setStates[setNum] || 'pending'}
                completedReps={completedSet?.reps}
                completedWeight={completedSet?.weight_kg}
                onComplete={(weight, reps) => handleSetComplete(setNum, weight, reps)}
              />
            );
          })}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handlePreviousExercise}
            disabled={currentExerciseIndex === 0}
            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-white border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous
          </button>

          <button
            onClick={handleNextExercise}
            disabled={currentExerciseIndex === totalExercises - 1}
            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* All Sets Completed Message */}
        {allSetsCompleted && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-6 bg-green-50 border-2 border-green-500 rounded-xl p-6 text-center"
          >
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-green-900 mb-2">Exercise Complete!</h3>
            <p className="text-green-700">
              Great job! {currentExerciseIndex < totalExercises - 1 ? 'Move to the next exercise when ready.' : 'You finished all exercises!'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
