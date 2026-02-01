/**
 * Periodization Generator Utilities
 *
 * Generates structured training mesocycles with automatic progression
 */

import type {
  PeriodizationConfig,
  GeneratedPeriodizationPlan,
  PeriodizationPhaseInsert,
  PeriodizationPhase,
} from './types';

/**
 * Generate a complete periodization plan based on program length
 *
 * Standard template:
 * - Weeks 1-4: Hypertrophy (8-12 reps, 70-75%)
 * - Weeks 5-8: Strength (5-8 reps, 80-85%)
 * - Weeks 9-11: Peak (3-6 reps, 85-90%)
 * - Week 12: Deload + Testing
 */
export function generatePeriodizationPlan(
  programId: string,
  config: PeriodizationConfig
): GeneratedPeriodizationPlan {
  const { program_length_weeks, program_type = 'general', include_deload = true } = config;

  const phases: PeriodizationPhaseInsert[] = [];

  switch (program_length_weeks) {
    case 4:
      phases.push(...generate4WeekPlan(programId, program_type, include_deload));
      break;
    case 8:
      phases.push(...generate8WeekPlan(programId, program_type, include_deload));
      break;
    case 12:
      phases.push(...generate12WeekPlan(programId, program_type, include_deload));
      break;
    case 16:
      phases.push(...generate16WeekPlan(programId, program_type, include_deload));
      break;
    default:
      throw new Error(`Unsupported program length: ${program_length_weeks}`);
  }

  return {
    total_weeks: program_length_weeks,
    phases,
    description: getPlanDescription(program_length_weeks, program_type),
    recommended_for: getRecommendedFor(program_type),
  };
}

/**
 * Generate 4-week plan (single phase)
 */
function generate4WeekPlan(
  programId: string,
  programType: string,
  includeDeload: boolean
): PeriodizationPhaseInsert[] {
  const phases: PeriodizationPhaseInsert[] = [];

  if (programType === 'strength') {
    // 3 weeks strength + 1 week deload
    phases.push({
      program_id: programId,
      phase_type: 'strength',
      phase_order: 1,
      start_week: 1,
      end_week: includeDeload ? 3 : 4,
      target_rep_min: 5,
      target_rep_max: 8,
      intensity_percent_min: 80,
      intensity_percent_max: 85,
      target_sets_per_exercise: 4,
      rest_seconds_compounds: 240,
      rest_seconds_accessories: 180,
      description: 'Strength building phase',
      is_active: true,
    });

    if (includeDeload) {
      phases.push({
        program_id: programId,
        phase_type: 'deload',
        phase_order: 2,
        start_week: 4,
        end_week: 4,
        target_rep_min: 5,
        target_rep_max: 8,
        intensity_percent_min: 80,
        intensity_percent_max: 85,
        target_sets_per_exercise: 2,
        rest_seconds_compounds: 180,
        rest_seconds_accessories: 120,
        description: 'Recovery week - reduced volume',
        is_active: false,
      });
    }
  } else {
    // 3 weeks hypertrophy + 1 week deload
    phases.push({
      program_id: programId,
      phase_type: 'hypertrophy',
      phase_order: 1,
      start_week: 1,
      end_week: includeDeload ? 3 : 4,
      target_rep_min: 8,
      target_rep_max: 12,
      intensity_percent_min: 70,
      intensity_percent_max: 75,
      target_sets_per_exercise: 3,
      rest_seconds_compounds: 180,
      rest_seconds_accessories: 120,
      description: 'Muscle building phase',
      is_active: true,
    });

    if (includeDeload) {
      phases.push({
        program_id: programId,
        phase_type: 'deload',
        phase_order: 2,
        start_week: 4,
        end_week: 4,
        target_rep_min: 8,
        target_rep_max: 12,
        intensity_percent_min: 70,
        intensity_percent_max: 75,
        target_sets_per_exercise: 2,
        rest_seconds_compounds: 150,
        rest_seconds_accessories: 90,
        description: 'Recovery week - reduced volume',
        is_active: false,
      });
    }
  }

  return phases;
}

/**
 * Generate 8-week plan (2 phases)
 */
function generate8WeekPlan(
  programId: string,
  programType: string,
  includeDeload: boolean
): PeriodizationPhaseInsert[] {
  const phases: PeriodizationPhaseInsert[] = [];

  if (programType === 'strength' || programType === 'powerlifting') {
    // Weeks 1-4: Hypertrophy foundation
    phases.push({
      program_id: programId,
      phase_type: 'hypertrophy',
      phase_order: 1,
      start_week: 1,
      end_week: 4,
      target_rep_min: 8,
      target_rep_max: 12,
      intensity_percent_min: 70,
      intensity_percent_max: 75,
      target_sets_per_exercise: 3,
      rest_seconds_compounds: 180,
      rest_seconds_accessories: 120,
      description: 'Foundation phase - build work capacity',
      is_active: true,
    });

    // Weeks 5-7: Strength building
    phases.push({
      program_id: programId,
      phase_type: 'strength',
      phase_order: 2,
      start_week: 5,
      end_week: includeDeload ? 7 : 8,
      target_rep_min: 5,
      target_rep_max: 8,
      intensity_percent_min: 80,
      intensity_percent_max: 85,
      target_sets_per_exercise: 4,
      rest_seconds_compounds: 240,
      rest_seconds_accessories: 180,
      description: 'Strength phase - heavy lifting',
      is_active: false,
    });

    if (includeDeload) {
      phases.push({
        program_id: programId,
        phase_type: 'deload',
        phase_order: 3,
        start_week: 8,
        end_week: 8,
        target_rep_min: 5,
        target_rep_max: 8,
        intensity_percent_min: 80,
        intensity_percent_max: 85,
        target_sets_per_exercise: 2,
        rest_seconds_compounds: 180,
        rest_seconds_accessories: 120,
        description: 'Recovery week - reduced volume',
        is_active: false,
      });
    }
  } else {
    // Hypertrophy focus: 2 blocks of 4 weeks
    phases.push({
      program_id: programId,
      phase_type: 'hypertrophy',
      phase_order: 1,
      start_week: 1,
      end_week: 4,
      target_rep_min: 8,
      target_rep_max: 12,
      intensity_percent_min: 70,
      intensity_percent_max: 75,
      target_sets_per_exercise: 3,
      rest_seconds_compounds: 180,
      rest_seconds_accessories: 120,
      description: 'Hypertrophy block 1 - moderate volume',
      is_active: true,
    });

    phases.push({
      program_id: programId,
      phase_type: 'hypertrophy',
      phase_order: 2,
      start_week: 5,
      end_week: includeDeload ? 7 : 8,
      target_rep_min: 6,
      target_rep_max: 10,
      intensity_percent_min: 75,
      intensity_percent_max: 80,
      target_sets_per_exercise: 4,
      rest_seconds_compounds: 180,
      rest_seconds_accessories: 120,
      description: 'Hypertrophy block 2 - increased intensity',
      is_active: false,
    });

    if (includeDeload) {
      phases.push({
        program_id: programId,
        phase_type: 'deload',
        phase_order: 3,
        start_week: 8,
        end_week: 8,
        target_rep_min: 8,
        target_rep_max: 12,
        intensity_percent_min: 70,
        intensity_percent_max: 75,
        target_sets_per_exercise: 2,
        rest_seconds_compounds: 150,
        rest_seconds_accessories: 90,
        description: 'Recovery week - reduced volume',
        is_active: false,
      });
    }
  }

  return phases;
}

/**
 * Generate 12-week plan (classic periodization)
 */
function generate12WeekPlan(
  programId: string,
  programType: string,
  includeDeload: boolean
): PeriodizationPhaseInsert[] {
  const phases: PeriodizationPhaseInsert[] = [];

  // Weeks 1-4: Hypertrophy
  phases.push({
    program_id: programId,
    phase_type: 'hypertrophy',
    phase_order: 1,
    start_week: 1,
    end_week: 4,
    target_rep_min: 8,
    target_rep_max: 12,
    intensity_percent_min: 70,
    intensity_percent_max: 75,
    target_sets_per_exercise: 3,
    rest_seconds_compounds: 180,
    rest_seconds_accessories: 120,
    description: 'Hypertrophy phase - build muscle and work capacity',
    is_active: true,
  });

  // Weeks 5-8: Strength
  phases.push({
    program_id: programId,
    phase_type: 'strength',
    phase_order: 2,
    start_week: 5,
    end_week: 8,
    target_rep_min: 5,
    target_rep_max: 8,
    intensity_percent_min: 80,
    intensity_percent_max: 85,
    target_sets_per_exercise: 4,
    rest_seconds_compounds: 240,
    rest_seconds_accessories: 180,
    description: 'Strength phase - heavy compound lifts',
    is_active: false,
  });

  // Weeks 9-11: Peak
  phases.push({
    program_id: programId,
    phase_type: 'peak',
    phase_order: 3,
    start_week: 9,
    end_week: 11,
    target_rep_min: 3,
    target_rep_max: 6,
    intensity_percent_min: 85,
    intensity_percent_max: 90,
    target_sets_per_exercise: 5,
    rest_seconds_compounds: 300,
    rest_seconds_accessories: 180,
    description: 'Peaking phase - very heavy training',
    is_active: false,
  });

  // Week 12: Deload + Testing
  if (includeDeload) {
    phases.push({
      program_id: programId,
      phase_type: 'deload',
      phase_order: 4,
      start_week: 12,
      end_week: 12,
      target_rep_min: 1,
      target_rep_max: 5,
      intensity_percent_min: 85,
      intensity_percent_max: 100,
      target_sets_per_exercise: 1,
      rest_seconds_compounds: 300,
      rest_seconds_accessories: 180,
      description: 'Testing week - test new 1RMs',
      is_active: false,
    });
  } else {
    // Extend peak phase
    phases[2].end_week = 12;
  }

  return phases;
}

/**
 * Generate 16-week plan (extended periodization)
 */
function generate16WeekPlan(
  programId: string,
  programType: string,
  includeDeload: boolean
): PeriodizationPhaseInsert[] {
  const phases: PeriodizationPhaseInsert[] = [];

  // Weeks 1-5: Hypertrophy
  phases.push({
    program_id: programId,
    phase_type: 'hypertrophy',
    phase_order: 1,
    start_week: 1,
    end_week: 5,
    target_rep_min: 8,
    target_rep_max: 12,
    intensity_percent_min: 70,
    intensity_percent_max: 75,
    target_sets_per_exercise: 3,
    rest_seconds_compounds: 180,
    rest_seconds_accessories: 120,
    description: 'Hypertrophy phase - build muscle mass',
    is_active: true,
  });

  // Weeks 6-10: Strength
  phases.push({
    program_id: programId,
    phase_type: 'strength',
    phase_order: 2,
    start_week: 6,
    end_week: 10,
    target_rep_min: 5,
    target_rep_max: 8,
    intensity_percent_min: 80,
    intensity_percent_max: 85,
    target_sets_per_exercise: 4,
    rest_seconds_compounds: 240,
    rest_seconds_accessories: 180,
    description: 'Strength phase - build max strength',
    is_active: false,
  });

  // Weeks 11-15: Peak
  phases.push({
    program_id: programId,
    phase_type: 'peak',
    phase_order: 3,
    start_week: 11,
    end_week: 15,
    target_rep_min: 3,
    target_rep_max: 6,
    intensity_percent_min: 85,
    intensity_percent_max: 90,
    target_sets_per_exercise: 5,
    rest_seconds_compounds: 300,
    rest_seconds_accessories: 180,
    description: 'Peaking phase - prepare for max lifts',
    is_active: false,
  });

  // Week 16: Deload + Testing
  if (includeDeload) {
    phases.push({
      program_id: programId,
      phase_type: 'deload',
      phase_order: 4,
      start_week: 16,
      end_week: 16,
      target_rep_min: 1,
      target_rep_max: 5,
      intensity_percent_min: 85,
      intensity_percent_max: 100,
      target_sets_per_exercise: 1,
      rest_seconds_compounds: 300,
      rest_seconds_accessories: 180,
      description: 'Testing week - max out and celebrate PRs',
      is_active: false,
    });
  } else {
    phases[2].end_week = 16;
  }

  return phases;
}

/**
 * Get plan description based on length and type
 */
function getPlanDescription(weeks: number, type: string): string {
  const typeDescriptions = {
    strength: 'focused on building maximum strength',
    hypertrophy: 'focused on muscle growth and size',
    powerlifting: 'optimized for powerlifting competition',
    general: 'balanced approach to strength and size',
  };

  const baseDescription = typeDescriptions[type as keyof typeof typeDescriptions] || 'structured training plan';

  return `${weeks}-week periodized program ${baseDescription}`;
}

/**
 * Get recommended user types for program
 */
function getRecommendedFor(type: string): string[] {
  const recommendations = {
    strength: ['Intermediate lifters', 'Advanced athletes', 'Strength enthusiasts'],
    hypertrophy: ['Bodybuilders', 'Aesthetic goals', 'Muscle building'],
    powerlifting: ['Powerlifters', 'Competitive athletes', 'Max strength goals'],
    general: ['Beginners', 'General fitness', 'Balanced development'],
  };

  return recommendations[type as keyof typeof recommendations] || ['All levels'];
}

/**
 * Get current active phase for a program
 */
export function getCurrentPhase(
  phases: PeriodizationPhase[],
  currentWeek: number
): PeriodizationPhase | null {
  for (const phase of phases) {
    if (currentWeek >= phase.start_week && currentWeek <= phase.end_week) {
      return phase;
    }
  }

  return null;
}

/**
 * Calculate which week of the program we're in
 */
export function calculateProgramWeek(programStartDate: string): number {
  const start = new Date(programStartDate);
  const now = new Date();

  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1; // Week 1, 2, 3, etc.

  return Math.max(1, week);
}

/**
 * Apply phase parameters to exercise
 */
export function applyPhaseToExercise(params: {
  exerciseId: string;
  currentWeight: number;
  estimated1RM: number;
  phase: PeriodizationPhase;
}): {
  targetReps: number;
  targetSets: number;
  targetWeight: number;
  restSeconds: number;
  intensity: number;
} {
  const { currentWeight, estimated1RM, phase } = params;

  // Use middle of rep range
  const targetReps = Math.floor((phase.target_rep_min + phase.target_rep_max) / 2);

  // Use middle of intensity range
  const intensityPercent = (phase.intensity_percent_min + phase.intensity_percent_max) / 2;

  // Calculate target weight based on intensity and estimated 1RM
  let targetWeight = Math.round((estimated1RM * intensityPercent) / 100);

  // Ensure we don't go below current weight in progression phases
  if (phase.phase_type !== 'deload' && targetWeight < currentWeight) {
    targetWeight = currentWeight;
  }

  return {
    targetReps,
    targetSets: phase.target_sets_per_exercise,
    targetWeight,
    restSeconds: phase.rest_seconds_compounds,
    intensity: intensityPercent,
  };
}
