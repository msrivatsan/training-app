// Power Rating (Strength Score) Calculation Utilities

import { StrengthScore } from './types';

/**
 * Calculate Power Rating from individual lift 1RMs and bodyweight
 * Formula: (Squat + Deadlift + Bench + OHP + Weighted Dip + Weighted Pull-up) / Bodyweight
 */
export function calculatePowerRating(
  squatMax: number,
  deadliftMax: number,
  benchMax: number,
  ohpMax: number,
  weightedDipMax: number,
  weightedPullupMax: number,
  bodyweight: number
): number {
  if (bodyweight === 0) return 0;

  const totalStrength =
    squatMax +
    deadliftMax +
    benchMax +
    ohpMax +
    weightedDipMax +
    weightedPullupMax;

  return parseFloat((totalStrength / bodyweight).toFixed(2));
}

/**
 * Estimate 1RM from weight and reps using Epley formula
 * 1RM = weight × (1 + reps / 30)
 */
export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps > 12) return weight; // Don't estimate from high rep sets

  // Epley formula
  const estimated1RM = weight * (1 + reps / 30);

  return parseFloat(estimated1RM.toFixed(2));
}

/**
 * Estimate 1RM using multiple formulas and return the average
 */
export function estimateAccurate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps > 12) return weight;

  // Epley: 1RM = weight × (1 + reps / 30)
  const epley = weight * (1 + reps / 30);

  // Brzycki: 1RM = weight × (36 / (37 - reps))
  const brzycki = weight * (36 / (37 - reps));

  // Lombardi: 1RM = weight × reps^0.1
  const lombardi = weight * Math.pow(reps, 0.1);

  // Average the three formulas
  const average = (epley + brzycki + lombardi) / 3;

  return parseFloat(average.toFixed(2));
}

/**
 * Get the best estimated 1RM from a set of recent sets
 */
export function getBest1RMFromSets(
  sets: Array<{ weight_kg: number; reps: number; is_warmup: boolean }>
): number {
  const workingSets = sets.filter((set) => !set.is_warmup);

  if (workingSets.length === 0) return 0;

  const estimated1RMs = workingSets.map((set) =>
    estimateAccurate1RM(set.weight_kg, set.reps)
  );

  return Math.max(...estimated1RMs);
}

/**
 * Get strength level category based on power rating
 */
export function getStrengthLevel(powerRating: number): {
  level: string;
  color: string;
  description: string;
} {
  if (powerRating >= 20) {
    return {
      level: 'World Class',
      color: 'text-purple-600',
      description: 'Elite competitive strength',
    };
  } else if (powerRating >= 15) {
    return {
      level: 'Elite',
      color: 'text-amber-600',
      description: 'Exceptional strength athlete',
    };
  } else if (powerRating >= 10) {
    return {
      level: 'Advanced',
      color: 'text-orange-600',
      description: 'Very strong lifter',
    };
  } else if (powerRating >= 7) {
    return {
      level: 'Intermediate',
      color: 'text-blue-600',
      description: 'Solid strength foundation',
    };
  } else if (powerRating >= 5) {
    return {
      level: 'Novice+',
      color: 'text-green-600',
      description: 'Building strength',
    };
  } else if (powerRating >= 3) {
    return {
      level: 'Novice',
      color: 'text-gray-600',
      description: 'Beginning strength journey',
    };
  } else {
    return {
      level: 'Beginner',
      color: 'text-gray-500',
      description: 'Just starting out',
    };
  }
}

/**
 * Calculate improvement percentage between two power ratings
 */
export function calculatePowerRatingImprovement(
  oldRating: number,
  newRating: number
): {
  percentage: number;
  absolute: number;
  improved: boolean;
} {
  const absolute = parseFloat((newRating - oldRating).toFixed(2));
  const percentage =
    oldRating > 0
      ? parseFloat(((absolute / oldRating) * 100).toFixed(1))
      : 0;

  return {
    percentage,
    absolute,
    improved: absolute > 0,
  };
}

/**
 * Get gauge color based on power rating value
 */
export function getPowerRatingGaugeColor(powerRating: number): string {
  if (powerRating >= 20) return '#9333ea'; // purple-600
  if (powerRating >= 15) return '#d97706'; // amber-600
  if (powerRating >= 10) return '#ea580c'; // orange-600
  if (powerRating >= 7) return '#2563eb'; // blue-600
  if (powerRating >= 5) return '#16a34a'; // green-600
  if (powerRating >= 3) return '#4b5563'; // gray-600
  return '#6b7280'; // gray-500
}

/**
 * Format power rating for display
 */
export function formatPowerRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * Calculate expected power rating based on experience level
 */
export function getExpectedPowerRating(
  experienceYears: number
): { min: number; max: number; target: number } {
  if (experienceYears < 0.5) {
    return { min: 2, max: 4, target: 3 };
  } else if (experienceYears < 1) {
    return { min: 4, max: 6, target: 5 };
  } else if (experienceYears < 2) {
    return { min: 6, max: 9, target: 7.5 };
  } else if (experienceYears < 4) {
    return { min: 8, max: 12, target: 10 };
  } else if (experienceYears < 6) {
    return { min: 11, max: 16, target: 13.5 };
  } else {
    return { min: 14, max: 25, target: 18 };
  }
}

/**
 * Get list of exercises needed for complete power rating
 */
export const POWER_RATING_EXERCISES = [
  'Squat',
  'Deadlift',
  'Bench Press',
  'Overhead Press',
  'Weighted Dip',
  'Weighted Pull-up',
] as const;

/**
 * Check if user has all exercises tracked for power rating
 */
export function hasCompletePowerRating(strengthScore: Partial<StrengthScore>): {
  complete: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!strengthScore.squat_1rm_kg || strengthScore.squat_1rm_kg === 0)
    missing.push('Squat');
  if (!strengthScore.deadlift_1rm_kg || strengthScore.deadlift_1rm_kg === 0)
    missing.push('Deadlift');
  if (!strengthScore.bench_1rm_kg || strengthScore.bench_1rm_kg === 0)
    missing.push('Bench Press');
  if (!strengthScore.ohp_1rm_kg || strengthScore.ohp_1rm_kg === 0)
    missing.push('Overhead Press');
  if (!strengthScore.weighted_dip_1rm_kg || strengthScore.weighted_dip_1rm_kg === 0)
    missing.push('Weighted Dip');
  if (!strengthScore.weighted_pullup_1rm_kg || strengthScore.weighted_pullup_1rm_kg === 0)
    missing.push('Weighted Pull-up');

  return {
    complete: missing.length === 0,
    missing,
  };
}
