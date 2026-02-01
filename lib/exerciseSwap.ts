/**
 * Exercise Swap Utility Functions
 *
 * Smart exercise substitution system with:
 * - Movement pattern matching
 * - Equipment filtering
 * - Difficulty-based suggestions
 * - Intelligent weight/volume adjustments
 */

import type {
  ExerciseLibraryWithMovementPattern,
  ExerciseAlternative,
  SwapSuggestion,
  MovementPatternType,
  ExerciseSwapFilter,
  EquipmentProfile,
} from './types';

// ============================================================================
// SMART WEIGHT ADJUSTMENTS
// ============================================================================

/**
 * Weight adjustment multipliers when swapping exercises
 * Based on biomechanics and typical strength ratios
 */
const WEIGHT_ADJUSTMENTS: Record<string, Record<string, number>> = {
  // Squat variations
  'Barbell Squat': {
    'Front Squat': 0.85,           // Front squat typically 85% of back squat
    'Leg Press': 1.4,              // Leg press typically 140% of squat
    'Hack Squat': 1.2,             // Hack squat ~120% of back squat
    'Goblet Squat': 0.4,           // Much lighter (dumbbell vs barbell)
  },
  'Front Squat': {
    'Barbell Squat': 1.18,         // Inverse of 0.85
    'Leg Press': 1.65,             // 1.4 * 1.18
    'Hack Squat': 1.41,            // 1.2 * 1.18
  },
  'Leg Press': {
    'Barbell Squat': 0.71,         // Inverse of 1.4
    'Front Squat': 0.61,           // 0.85 * 0.71
    'Hack Squat': 0.86,            // 1.2 / 1.4
  },

  // Bench Press variations
  'Barbell Bench Press': {
    'Incline Barbell Bench Press': 0.85,
    'Decline Bench Press': 1.10,
    'Dumbbell Bench Press': 0.65,  // Total weight (both dumbbells)
    'Incline Dumbbell Press': 0.60,
    'Close-Grip Bench Press': 0.90,
  },
  'Dumbbell Bench Press': {
    'Barbell Bench Press': 1.54,   // Inverse of 0.65
    'Incline Dumbbell Press': 0.92,
  },

  // Deadlift variations
  'Conventional Deadlift': {
    'Sumo Deadlift': 0.95,
    'Romanian Deadlift': 0.75,
    'Trap Bar Deadlift': 1.05,
  },
  'Romanian Deadlift': {
    'Conventional Deadlift': 1.33, // Inverse of 0.75
    'Good Morning': 0.80,
  },

  // Pull-up variations
  'Weighted Pull-ups': {
    'Lat Pulldown': 1.0,           // Similar 1:1
    'Chin-ups': 1.0,               // Similar difficulty
  },
  'Lat Pulldown': {
    'Weighted Pull-ups': 1.0,
    'Chin-ups': 1.0,
  },

  // Row variations
  'Barbell Row': {
    'Dumbbell Row': 0.70,          // Total weight (both dumbbells)
    'T-Bar Row': 0.90,
    'Seated Cable Row': 0.85,
  },
  'Dumbbell Row': {
    'Barbell Row': 1.43,           // Inverse of 0.70
    'Single-Arm Dumbbell Row': 0.50, // One arm at a time
  },

  // Overhead Press variations
  'Overhead Press (OHP)': {
    'Dumbbell Shoulder Press': 0.65,
    'Arnold Press': 0.60,
  },
  'Dumbbell Shoulder Press': {
    'Overhead Press (OHP)': 1.54,
    'Arnold Press': 0.92,
  },
};

/**
 * Get weight adjustment multiplier for exercise swap
 */
export function getWeightAdjustment(
  fromExercise: string,
  toExercise: string
): number | null {
  // Check direct mapping
  const directMapping = WEIGHT_ADJUSTMENTS[fromExercise]?.[toExercise];
  if (directMapping) {
    return directMapping;
  }

  // Check reverse mapping (inverse)
  const reverseMapping = WEIGHT_ADJUSTMENTS[toExercise]?.[fromExercise];
  if (reverseMapping) {
    return 1 / reverseMapping;
  }

  return null;
}

// ============================================================================
// SMART SUGGESTIONS ENGINE
// ============================================================================

/**
 * Generate smart suggestions when swapping exercises
 */
export function generateSwapSuggestion(
  originalExercise: ExerciseLibraryWithMovementPattern,
  newExercise: ExerciseLibraryWithMovementPattern,
  currentWeight?: number
): SwapSuggestion {
  // Check for weight adjustment
  const weightMultiplier = getWeightAdjustment(
    originalExercise.name,
    newExercise.name
  );

  if (weightMultiplier && currentWeight) {
    const suggestedWeight = Math.round(currentWeight * weightMultiplier * 2) / 2; // Round to nearest 0.5
    const percentChange = Math.round((weightMultiplier - 1) * 100);

    return {
      type: 'weight_adjustment',
      message: `Suggested weight: ${suggestedWeight}kg (${percentChange > 0 ? '+' : ''}${percentChange}% from ${originalExercise.name})`,
      weight_multiplier: weightMultiplier,
    };
  }

  // Check compound → isolation swap
  if (originalExercise.is_compound && !newExercise.is_compound) {
    return {
      type: 'add_exercise',
      message: `You're swapping a compound movement for an isolation exercise. Consider adding another exercise to maintain total volume.`,
      suggested_exercises: getSuggestedComplementaryExercises(originalExercise, newExercise),
    };
  }

  // Check difficulty downgrade
  const difficultyMap = { beginner: 1, intermediate: 2, advanced: 3 };
  const originalDifficulty = difficultyMap[originalExercise.difficulty_level];
  const newDifficulty = difficultyMap[newExercise.difficulty_level];

  if (originalDifficulty > newDifficulty && newExercise.is_compound) {
    return {
      type: 'volume_adjustment',
      message: `${newExercise.name} is easier than ${originalExercise.name}. Consider adding 1-2 more sets to maintain stimulus.`,
      volume_adjustment: {
        sets_delta: 1,
        reps_delta: 0,
      },
    };
  }

  // Check bilateral → unilateral swap
  const isOriginalBilateral = !originalExercise.name.toLowerCase().includes('single') &&
                              !originalExercise.name.toLowerCase().includes('one-arm');
  const isNewUnilateral = newExercise.name.toLowerCase().includes('single') ||
                         newExercise.name.toLowerCase().includes('one-arm') ||
                         newExercise.name.toLowerCase().includes('bulgarian');

  if (isOriginalBilateral && isNewUnilateral) {
    return {
      type: 'volume_adjustment',
      message: `${newExercise.name} is unilateral. You'll need to double the sets (per leg/arm).`,
      volume_adjustment: {
        sets_delta: 0, // Sets stay the same per side
        reps_delta: 0,
      },
    };
  }

  return {
    type: 'none',
    message: `Good swap! ${newExercise.name} targets the same muscles with similar movement pattern.`,
  };
}

/**
 * Get complementary exercises for compound → isolation swaps
 */
function getSuggestedComplementaryExercises(
  originalExercise: ExerciseLibraryWithMovementPattern,
  newExercise: ExerciseLibraryWithMovementPattern
): string[] {
  const suggestions: string[] = [];

  // If swapping bench press for chest fly, suggest tricep work
  if (
    originalExercise.primary_muscle_group === 'chest' &&
    originalExercise.is_compound &&
    newExercise.name.toLowerCase().includes('fly')
  ) {
    suggestions.push('Tricep Extension', 'Close-Grip Bench Press');
  }

  // If swapping squat for leg extension, suggest hamstring and glute work
  if (
    originalExercise.primary_muscle_group === 'quads' &&
    originalExercise.is_compound &&
    newExercise.name.toLowerCase().includes('extension')
  ) {
    suggestions.push('Hamstring Curl', 'Hip Thrust');
  }

  // If swapping pull-up for bicep curl, suggest lat work
  if (
    originalExercise.primary_muscle_group === 'back' &&
    originalExercise.is_compound &&
    newExercise.primary_muscle_group === 'biceps'
  ) {
    suggestions.push('Lat Pulldown', 'Seated Cable Row');
  }

  return suggestions;
}

// ============================================================================
// EQUIPMENT COMPATIBILITY
// ============================================================================

/**
 * Check if exercise is compatible with available equipment
 */
export function isEquipmentCompatible(
  exercise: ExerciseLibraryWithMovementPattern,
  equipmentProfile: EquipmentProfile | null
): boolean {
  // No profile = all equipment available
  if (!equipmentProfile || equipmentProfile.available_equipment.length === 0) {
    return true;
  }

  // Bodyweight exercises are always compatible
  if (
    exercise.equipment_needed.length === 0 ||
    exercise.equipment_needed.includes('bodyweight')
  ) {
    return true;
  }

  // Check if all required equipment is available
  return exercise.equipment_needed.every((equipment) =>
    equipmentProfile.available_equipment.includes(equipment)
  );
}

/**
 * Get missing equipment for an exercise
 */
export function getMissingEquipment(
  exercise: ExerciseLibraryWithMovementPattern,
  equipmentProfile: EquipmentProfile | null
): string[] {
  if (!equipmentProfile || equipmentProfile.available_equipment.length === 0) {
    return [];
  }

  return exercise.equipment_needed.filter(
    (equipment) => !equipmentProfile.available_equipment.includes(equipment)
  );
}

// ============================================================================
// COMPATIBILITY SCORING
// ============================================================================

/**
 * Calculate compatibility score between original and alternative exercise
 * Score: 0-100, higher is better match
 */
export function calculateCompatibilityScore(
  original: ExerciseLibraryWithMovementPattern,
  alternative: ExerciseLibraryWithMovementPattern,
  equipmentProfile: EquipmentProfile | null
): number {
  let score = 0;

  // Movement pattern match (50 points)
  if (original.movement_pattern === alternative.movement_pattern) {
    score += 50;
  } else if (
    // Related patterns get partial credit
    isRelatedMovementPattern(original.movement_pattern, alternative.movement_pattern)
  ) {
    score += 25;
  }

  // Primary muscle group match (30 points)
  if (original.primary_muscle_group === alternative.primary_muscle_group) {
    score += 30;
  } else if (
    // Secondary muscle groups match
    alternative.secondary_muscle_groups.includes(original.primary_muscle_group) ||
    original.secondary_muscle_groups.includes(alternative.primary_muscle_group)
  ) {
    score += 15;
  }

  // Difficulty level match (10 points)
  if (original.difficulty_level === alternative.difficulty_level) {
    score += 10;
  } else {
    const difficultyMap = { beginner: 1, intermediate: 2, advanced: 3 };
    const diff = Math.abs(
      difficultyMap[original.difficulty_level] - difficultyMap[alternative.difficulty_level]
    );
    score += Math.max(0, 10 - diff * 5);
  }

  // Equipment availability (10 points)
  if (isEquipmentCompatible(alternative, equipmentProfile)) {
    score += 10;
  }

  // Compound type match (bonus)
  if (original.is_compound === alternative.is_compound) {
    score += 5;
  }

  return Math.min(100, score);
}

/**
 * Check if two movement patterns are related
 */
function isRelatedMovementPattern(
  pattern1: MovementPatternType | null,
  pattern2: MovementPatternType | null
): boolean {
  if (!pattern1 || !pattern2) return false;

  const relatedPatterns: Record<string, string[]> = {
    horizontal_push: ['vertical_push'],
    vertical_push: ['horizontal_push'],
    horizontal_pull: ['vertical_pull'],
    vertical_pull: ['horizontal_pull'],
    squat_pattern: ['lunge_pattern'],
    lunge_pattern: ['squat_pattern'],
    hinge_pattern: ['squat_pattern'],
    core_rotation: ['core_stability', 'core_flexion'],
    core_stability: ['core_rotation', 'core_flexion'],
    core_flexion: ['core_rotation', 'core_stability'],
  };

  return relatedPatterns[pattern1]?.includes(pattern2) || false;
}

// ============================================================================
// EXERCISE ALTERNATIVE FINDER
// ============================================================================

/**
 * Find alternative exercises based on criteria
 */
export function findAlternativeExercises(
  originalExercise: ExerciseLibraryWithMovementPattern,
  allExercises: ExerciseLibraryWithMovementPattern[],
  filter: ExerciseSwapFilter = {},
  equipmentProfile: EquipmentProfile | null = null
): ExerciseAlternative[] {
  const {
    same_movement_pattern = true,
    same_muscle_group = true,
    same_difficulty = false,
    available_equipment_only = true,
    compound_only = false,
    max_results = 20,
  } = filter;

  // Filter alternatives
  let alternatives = allExercises.filter((exercise) => {
    // Don't include the same exercise
    if (exercise.id === originalExercise.id) return false;

    // Movement pattern filter
    if (same_movement_pattern && exercise.movement_pattern !== originalExercise.movement_pattern) {
      // Also allow related movement patterns
      if (!isRelatedMovementPattern(exercise.movement_pattern, originalExercise.movement_pattern)) {
        return false;
      }
    }

    // Muscle group filter (primary or secondary match)
    if (same_muscle_group) {
      const matchesPrimary = exercise.primary_muscle_group === originalExercise.primary_muscle_group;
      const matchesSecondary =
        exercise.secondary_muscle_groups.includes(originalExercise.primary_muscle_group) ||
        exercise.primary_muscle_group === originalExercise.secondary_muscle_groups[0] ||
        exercise.secondary_muscle_groups.some((muscle) =>
          originalExercise.secondary_muscle_groups.includes(muscle)
        );

      if (!matchesPrimary && !matchesSecondary) {
        return false;
      }
    }

    // Difficulty filter
    if (same_difficulty && exercise.difficulty_level !== originalExercise.difficulty_level) {
      return false;
    }

    // Compound filter
    if (compound_only && !exercise.is_compound) {
      return false;
    }

    // Equipment filter
    if (available_equipment_only && !isEquipmentCompatible(exercise, equipmentProfile)) {
      return false;
    }

    return true;
  });

  // Calculate compatibility scores and add suggestions
  const alternativesWithScores: ExerciseAlternative[] = alternatives.map((exercise) => {
    const compatibility_score = calculateCompatibilityScore(
      originalExercise,
      exercise,
      equipmentProfile
    );

    const swap_suggestion = generateSwapSuggestion(originalExercise, exercise);

    return {
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      primary_muscle_group: exercise.primary_muscle_group,
      movement_pattern: exercise.movement_pattern,
      equipment_needed: exercise.equipment_needed,
      difficulty_level: exercise.difficulty_level,
      is_compound: exercise.is_compound,
      compatibility_score,
      swap_suggestion,
    };
  });

  // Sort by compatibility score (descending)
  alternativesWithScores.sort((a, b) => b.compatibility_score - a.compatibility_score);

  // Limit results
  return alternativesWithScores.slice(0, max_results);
}

// ============================================================================
// MOVEMENT PATTERN UTILITIES
// ============================================================================

/**
 * Get movement pattern display name
 */
export function getMovementPatternLabel(pattern: MovementPatternType | null): string {
  if (!pattern) return 'Unclassified';

  const labels: Record<MovementPatternType, string> = {
    horizontal_push: 'Horizontal Push',
    vertical_push: 'Vertical Push',
    horizontal_pull: 'Horizontal Pull',
    vertical_pull: 'Vertical Pull',
    squat_pattern: 'Squat Pattern',
    hinge_pattern: 'Hinge Pattern',
    lunge_pattern: 'Lunge Pattern',
    isolation_upper: 'Upper Body Isolation',
    isolation_lower: 'Lower Body Isolation',
    core_rotation: 'Core Rotation',
    core_stability: 'Core Stability',
    core_flexion: 'Core Flexion',
    carry: 'Loaded Carry',
    explosive: 'Explosive/Plyometric',
    olympic: 'Olympic Lift',
  };

  return labels[pattern];
}

/**
 * Get movement pattern icon/emoji
 */
export function getMovementPatternIcon(pattern: MovementPatternType | null): string {
  if (!pattern) return '🏋️';

  const icons: Record<MovementPatternType, string> = {
    horizontal_push: '➡️',
    vertical_push: '⬆️',
    horizontal_pull: '⬅️',
    vertical_pull: '⬇️',
    squat_pattern: '🦵',
    hinge_pattern: '🔽',
    lunge_pattern: '🚶',
    isolation_upper: '💪',
    isolation_lower: '🦿',
    core_rotation: '🔄',
    core_stability: '🧘',
    core_flexion: '📐',
    carry: '🎒',
    explosive: '💥',
    olympic: '🏅',
  };

  return icons[pattern];
}

// ============================================================================
// COMMON EQUIPMENT PRESETS
// ============================================================================

export const EQUIPMENT_PRESETS: Record<string, string[]> = {
  'Home Gym - Full': [
    'barbell',
    'dumbbells',
    'bench',
    'squat rack',
    'pull-up bar',
    'resistance band',
    'ab wheel',
  ],
  'Home Gym - Minimal': [
    'dumbbells',
    'resistance band',
    'pull-up bar',
    'bodyweight',
  ],
  'Commercial Gym': [
    'barbell',
    'dumbbells',
    'cable',
    'machine',
    'bench',
    'squat rack',
    'pull-up bar',
    'dip bars',
    'kettlebell',
    'resistance band',
    't-bar',
    'ab wheel',
    'battle ropes',
    'sled',
    'medicine ball',
  ],
  'Bodyweight Only': [
    'bodyweight',
    'pull-up bar',
  ],
  'CrossFit Box': [
    'barbell',
    'dumbbells',
    'kettlebell',
    'box',
    'pull-up bar',
    'resistance band',
    'medicine ball',
    'battle ropes',
    'sled',
  ],
};
