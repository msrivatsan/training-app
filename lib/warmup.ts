/**
 * Warm-up Protocol Generator
 *
 * Generates structured warm-up protocols based on exercise type and working weight.
 */

import { WarmupSet } from './types';

/**
 * Generate warm-up protocol for compound lifts
 * 4 warm-up sets: empty bar, 50%, 70%, 85%
 */
export function generateCompoundWarmup(): WarmupSet[] {
  return [
    { sets: 1, reps: 10, intensity: 0 },    // Empty bar
    { sets: 1, reps: 8, intensity: 50 },   // 50% of working weight
    { sets: 1, reps: 5, intensity: 70 },   // 70% of working weight
    { sets: 1, reps: 3, intensity: 85 },   // 85% of working weight
  ];
}

/**
 * Generate warm-up protocol for accessory exercises
 * 1-2 warm-up sets: 40-60%
 */
export function generateAccessoryWarmup(): WarmupSet[] {
  return [
    { sets: 1, reps: 12, intensity: 40 },  // 40% of working weight
    { sets: 1, reps: 10, intensity: 60 },  // 60% of working weight
  ];
}

/**
 * Generate warm-up protocol based on exercise properties
 */
export function generateWarmupProtocol(isCompound: boolean, isPriority: boolean): WarmupSet[] {
  // Priority compound lifts (squat, bench, deadlift, etc.) get full warm-up
  if (isCompound || isPriority) {
    return generateCompoundWarmup();
  }

  // Accessory exercises get lighter warm-up
  return generateAccessoryWarmup();
}

/**
 * Calculate actual warm-up weights based on working weight
 */
export function calculateWarmupWeights(
  workingWeight: number,
  warmupProtocol: WarmupSet[]
): { sets: number; reps: number; weight: number }[] {
  return warmupProtocol.map(warmup => ({
    sets: warmup.sets,
    reps: warmup.reps,
    weight: warmup.intensity === 0 ? 20 : Math.round((workingWeight * warmup.intensity) / 100 / 2.5) * 2.5, // Round to nearest 2.5kg
  }));
}

/**
 * Calculate estimated 1RM from weight and reps using Epley formula
 */
export function calculateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight;
  // Epley formula: 1RM = weight × (1 + reps/30)
  return Math.round(weight * (1 + reps / 30));
}

/**
 * Calculate working weight from 1RM and intensity percentage
 */
export function calculateWorkingWeight(oneRepMax: number, intensityPercentage: number): number {
  const weight = (oneRepMax * intensityPercentage) / 100;
  // Round to nearest 2.5kg
  return Math.round(weight / 2.5) * 2.5;
}

/**
 * Get recommended rep range based on intensity percentage
 */
export function getRepRangeForIntensity(intensityPercentage: number): { min: number; max: number } {
  if (intensityPercentage >= 85) {
    return { min: 3, max: 5 };      // Very high intensity
  } else if (intensityPercentage >= 80) {
    return { min: 5, max: 8 };      // High intensity (A day)
  } else if (intensityPercentage >= 70) {
    return { min: 8, max: 12 };     // Moderate intensity (B day)
  } else if (intensityPercentage >= 60) {
    return { min: 12, max: 15 };    // Lower intensity
  } else {
    return { min: 15, max: 20 };    // Very low intensity
  }
}

/**
 * Get recommended rest time based on intensity and workout type
 */
export function getRestTimeForWorkout(
  workoutType: 'strength' | 'hypertrophy' | 'mixed' | 'deload',
  isCompound: boolean
): number {
  if (workoutType === 'strength') {
    return isCompound ? 240 : 180;  // 4 min for compounds, 3 min for accessories (A day)
  } else if (workoutType === 'hypertrophy') {
    return isCompound ? 180 : 120;  // 3 min for compounds, 2 min for accessories (B day)
  } else if (workoutType === 'deload') {
    return 120;                     // 2 min for deload
  } else {
    return isCompound ? 180 : 150;  // Mixed: 3 min for compounds, 2.5 min for accessories
  }
}
