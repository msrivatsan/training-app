/**
 * Workout Progression Utilities
 *
 * Smart weight suggestions and progression logic
 */

import type { Set } from './types';

/**
 * Represents a completed set from previous session
 */
interface PreviousSet {
  set_number: number;
  weight_kg: number;
  reps: number;
}

/**
 * Weight suggestion result
 */
export interface WeightSuggestion {
  suggestedWeight: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Calculate smart weight suggestion based on previous performance
 *
 * Rules:
 * - If last session was 4×8 @ 100kg (hit upper rep range) → suggest 102.5kg
 * - If last session was 4×6,7,8,8 (mixed reps within range) → suggest same 100kg
 * - If last session failed to complete sets → suggest 5% less
 * - B Day auto-suggests 10-15% less than A Day
 */
export function calculateWeightSuggestion(
  previousSets: PreviousSet[],
  targetReps: number,
  targetSets: number,
  workoutType?: 'strength' | 'hypertrophy' | 'mixed' | 'deload',
  aDayWeight?: number
): WeightSuggestion {
  // If no previous data, use A day weight with reduction for B day
  if (!previousSets || previousSets.length === 0) {
    if (workoutType === 'hypertrophy' && aDayWeight) {
      const reduced = aDayWeight * 0.85; // 15% less for B day
      return {
        suggestedWeight: roundToNearest2_5(reduced),
        reason: 'B Day: 15% less than A Day',
        confidence: 'medium',
      };
    }
    return {
      suggestedWeight: 0,
      reason: 'No previous data',
      confidence: 'low',
    };
  }

  const completedSets = previousSets.filter((s) => s.reps > 0);

  if (completedSets.length === 0) {
    return {
      suggestedWeight: 0,
      reason: 'No completed sets in previous session',
      confidence: 'low',
    };
  }

  // Calculate average weight and reps from previous session
  const avgWeight =
    completedSets.reduce((sum, s) => sum + s.weight_kg, 0) / completedSets.length;
  const avgReps = completedSets.reduce((sum, s) => sum + s.reps, 0) / completedSets.length;
  const minReps = Math.min(...completedSets.map((s) => s.reps));
  const maxReps = Math.max(...completedSets.map((s) => s.reps));

  // Check if user completed all target sets
  const completedAllSets = completedSets.length >= targetSets;

  // Define rep range (assuming ±2 from target)
  const repRangeMin = targetReps - 2;
  const repRangeMax = targetReps + 2;

  // Rule 1: Hit upper rep range consistently → Increase weight
  if (
    completedAllSets &&
    minReps >= repRangeMax - 1 &&
    avgReps >= repRangeMax - 1
  ) {
    const increased = avgWeight + 2.5;
    return {
      suggestedWeight: roundToNearest2_5(increased),
      reason: `Hit ${Math.round(avgReps)} reps consistently - time to progress!`,
      confidence: 'high',
    };
  }

  // Rule 2: Hit target reps on all sets → Small increase
  if (completedAllSets && minReps >= targetReps && avgReps >= targetReps) {
    const increased = avgWeight + 2.5;
    return {
      suggestedWeight: roundToNearest2_5(increased),
      reason: `Completed all sets at target reps - progressing`,
      confidence: 'high',
    };
  }

  // Rule 3: Mixed reps within range → Same weight
  if (
    completedAllSets &&
    minReps >= repRangeMin &&
    maxReps <= repRangeMax
  ) {
    return {
      suggestedWeight: roundToNearest2_5(avgWeight),
      reason: `Reps varied (${minReps}-${maxReps}) - build consistency`,
      confidence: 'high',
    };
  }

  // Rule 4: Failed to complete all sets → Reduce weight
  if (!completedAllSets) {
    const reduced = avgWeight * 0.95; // 5% reduction
    return {
      suggestedWeight: roundToNearest2_5(reduced),
      reason: `Incomplete sets last time - reducing load`,
      confidence: 'medium',
    };
  }

  // Rule 5: Reps too low → Reduce weight
  if (avgReps < repRangeMin) {
    const reduced = avgWeight * 0.95; // 5% reduction
    return {
      suggestedWeight: roundToNearest2_5(reduced),
      reason: `Only hit ${Math.round(avgReps)} reps - reducing load`,
      confidence: 'medium',
    };
  }

  // Default: Same weight
  return {
    suggestedWeight: roundToNearest2_5(avgWeight),
    reason: 'Continue with previous weight',
    confidence: 'medium',
  };
}

/**
 * Calculate B Day weight based on A Day performance
 *
 * B Day should be 10-15% lighter to allow for higher volume/reps
 */
export function calculateBDayWeight(aDayWeight: number): number {
  const reduced = aDayWeight * 0.85; // 15% reduction
  return roundToNearest2_5(reduced);
}

/**
 * Calculate if progression criteria are met
 *
 * Returns true if user should progress to heavier weight
 */
export function shouldProgress(
  completedSets: Set[],
  targetReps: number,
  targetSets: number
): boolean {
  if (completedSets.length < targetSets) {
    return false; // Didn't complete all sets
  }

  // Check if all sets hit target reps or higher
  const allSetsHitTarget = completedSets.every((s) => s.reps >= targetReps);

  return allSetsHitTarget;
}

/**
 * Calculate total volume for a workout session
 */
export function calculateTotalVolume(sets: Set[]): number {
  return sets.reduce((sum, set) => sum + set.weight_kg * set.reps, 0);
}

/**
 * Calculate XP earned from a workout
 *
 * XP Formula:
 * - 10 XP per completed set
 * - 100 XP for completing workout
 * - Bonus XP for high volume (1 XP per 100kg moved)
 * - Bonus XP for PRs (50 XP each)
 */
export function calculateXPEarned(
  setsCount: number,
  totalVolume: number,
  prsCount: number = 0
): number {
  const setXP = setsCount * 10;
  const completionBonus = 100;
  const volumeBonus = Math.floor(totalVolume / 100);
  const prBonus = prsCount * 50;

  return setXP + completionBonus + volumeBonus + prBonus;
}

/**
 * Determine if a new PR was achieved
 */
export function isPersonalRecord(
  currentWeight: number,
  currentReps: number,
  previousSets: Set[]
): boolean {
  if (!previousSets || previousSets.length === 0) {
    return true; // First time is always a PR
  }

  const currentScore = currentWeight * currentReps;
  const previousBestScore = Math.max(
    ...previousSets.map((s) => s.weight_kg * s.reps)
  );

  return currentScore > previousBestScore;
}

/**
 * Round weight to nearest 2.5kg increment
 */
export function roundToNearest2_5(weight: number): number {
  return Math.round(weight / 2.5) * 2.5;
}

/**
 * Calculate estimated 1RM from weight and reps (Epley formula)
 */
export function calculateEstimated1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  // Epley formula: 1RM = weight × (1 + reps/30)
  return Math.round(weight * (1 + reps / 30));
}

/**
 * Get progression status message
 */
export function getProgressionMessage(
  completedSets: Set[],
  targetReps: number,
  targetSets: number
): { message: string; type: 'success' | 'warning' | 'info' } {
  if (completedSets.length < targetSets) {
    return {
      message: `Incomplete: ${completedSets.length}/${targetSets} sets completed`,
      type: 'warning',
    };
  }

  const avgReps =
    completedSets.reduce((sum, s) => sum + s.reps, 0) / completedSets.length;
  const allHitTarget = completedSets.every((s) => s.reps >= targetReps);

  if (allHitTarget && avgReps >= targetReps + 2) {
    return {
      message: 'Excellent! Ready to increase weight next time',
      type: 'success',
    };
  }

  if (allHitTarget) {
    return {
      message: 'Good work! Hit all target reps',
      type: 'success',
    };
  }

  if (avgReps >= targetReps - 1) {
    return {
      message: 'Close! Try to hit target reps on all sets',
      type: 'info',
    };
  }

  return {
    message: 'Keep working! Focus on form and consistency',
    type: 'info',
  };
}

/**
 * Calculate rest time based on workout type and set performance
 *
 * Longer rest for heavy/strength work, shorter for hypertrophy
 */
export function calculateRestTime(
  workoutType: 'strength' | 'hypertrophy' | 'mixed' | 'deload',
  isCompound: boolean,
  setNumber: number,
  totalSets: number
): number {
  // Base rest times in seconds
  let baseRest: number;

  if (workoutType === 'strength') {
    baseRest = isCompound ? 240 : 180; // 4min for compounds, 3min for accessories
  } else if (workoutType === 'hypertrophy') {
    baseRest = isCompound ? 180 : 120; // 3min for compounds, 2min for accessories
  } else if (workoutType === 'deload') {
    baseRest = 120; // 2min for deload
  } else {
    baseRest = isCompound ? 180 : 150; // Mixed: 3min compounds, 2.5min accessories
  }

  // Reduce rest time for final set (already proven you can do it)
  if (setNumber === totalSets) {
    baseRest = Math.round(baseRest * 0.8);
  }

  return baseRest;
}
