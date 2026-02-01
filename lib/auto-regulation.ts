/**
 * Auto-Regulation Utilities
 *
 * RPE-based training adjustments and recommendations
 */

import type {
  Set,
  RpeWeeklyAverage,
  AutoRegulationRecommendation,
} from './types';

/**
 * Calculate RPE-based weight adjustment recommendation
 *
 * Rules:
 * - RPE > 9 for 2+ weeks → suggest deload
 * - RPE < 7 for 2+ weeks → suggest weight increase
 * - RPE 7-9 → maintain (optimal training zone)
 */
export function calculateRpeAdjustment(params: {
  exerciseId: string;
  exerciseName: string;
  recentRpeAverages: number[];
  currentWeight: number;
}): AutoRegulationRecommendation {
  const { exerciseId, exerciseName, recentRpeAverages, currentWeight } = params;

  if (recentRpeAverages.length === 0) {
    return {
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      current_average_rpe: 0,
      recommendation: 'maintain',
      reasoning: 'No RPE data available',
    };
  }

  // Calculate average of recent weeks
  const avgRpe =
    recentRpeAverages.reduce((sum, rpe) => sum + rpe, 0) / recentRpeAverages.length;

  // Check for consistently high RPE
  const highRpeWeeks = recentRpeAverages.filter((rpe) => rpe >= 9.0).length;

  if (highRpeWeeks >= 2) {
    return {
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      current_average_rpe: avgRpe,
      recommendation: 'deload_suggested',
      suggested_weight_change_kg: -currentWeight * 0.1, // 10% reduction
      reasoning: `RPE has been high (≥9.0) for ${highRpeWeeks} weeks. Consider a deload or reducing weight by 10%.`,
    };
  }

  // Check for consistently low RPE
  const lowRpeWeeks = recentRpeAverages.filter((rpe) => rpe < 7.0).length;

  if (lowRpeWeeks >= 2) {
    return {
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      current_average_rpe: avgRpe,
      recommendation: 'increase_weight',
      suggested_weight_change_kg: 5.0, // Add 5kg
      reasoning: `RPE has been low (<7.0) for ${lowRpeWeeks} weeks. You're ready to increase the weight.`,
    };
  }

  // Check for trending high (8.5-9.0)
  if (avgRpe >= 8.5 && avgRpe < 9.0) {
    // Check if trend is increasing
    if (recentRpeAverages.length >= 2) {
      const recentTrend =
        recentRpeAverages[recentRpeAverages.length - 1] -
        recentRpeAverages[recentRpeAverages.length - 2];

      if (recentTrend > 0.5) {
        return {
          exercise_id: exerciseId,
          exercise_name: exerciseName,
          current_average_rpe: avgRpe,
          recommendation: 'maintain',
          reasoning: 'RPE is trending upward. Monitor closely and consider a deload if it continues.',
        };
      }
    }
  }

  // Optimal range (7.0 - 8.5)
  if (avgRpe >= 7.0 && avgRpe <= 8.5) {
    return {
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      current_average_rpe: avgRpe,
      recommendation: 'maintain',
      reasoning: 'RPE is in the optimal training range (7-8.5). Keep up the good work!',
    };
  }

  // Moderate low RPE (7.0-7.5)
  if (avgRpe >= 7.0 && avgRpe < 7.5) {
    return {
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      current_average_rpe: avgRpe,
      recommendation: 'maintain',
      suggested_weight_change_kg: 2.5,
      reasoning: 'RPE is on the lower end. Consider adding 2.5kg next session.',
    };
  }

  // Default: maintain
  return {
    exercise_id: exerciseId,
    exercise_name: exerciseName,
    current_average_rpe: avgRpe,
    recommendation: 'maintain',
    reasoning: 'Continue with current training load.',
  };
}

/**
 * Calculate RPE average for a set of sets
 */
export function calculateAverageRpe(sets: Set[]): number {
  const setsWithRpe = sets.filter((s) => s.rpe !== null && !s.is_warmup);

  if (setsWithRpe.length === 0) {
    return 0;
  }

  const sum = setsWithRpe.reduce((acc, s) => acc + (s.rpe || 0), 0);
  return Math.round((sum / setsWithRpe.length) * 10) / 10; // Round to 1 decimal
}

/**
 * Get RPE description
 */
export function getRpeDescription(rpe: number): string {
  if (rpe >= 10) return 'Max effort - complete failure';
  if (rpe >= 9.5) return 'Extremely hard - 1 rep left';
  if (rpe >= 9) return 'Very hard - 2-3 reps left';
  if (rpe >= 8.5) return 'Hard - 3-4 reps left';
  if (rpe >= 8) return 'Challenging - 4-5 reps left';
  if (rpe >= 7.5) return 'Moderate - 5-6 reps left';
  if (rpe >= 7) return 'Somewhat easy - 6+ reps left';
  if (rpe >= 6) return 'Easy - many reps left';
  return 'Very easy - barely warming up';
}

/**
 * Get RPE color for UI
 */
export function getRpeColor(rpe: number): string {
  if (rpe >= 9.5) return 'red';
  if (rpe >= 9) return 'orange';
  if (rpe >= 8) return 'yellow';
  if (rpe >= 7) return 'green';
  return 'blue';
}

/**
 * Suggest RPE target based on workout type and set number
 */
export function suggestTargetRpe(params: {
  workoutType: 'strength' | 'hypertrophy' | 'mixed' | 'deload';
  setNumber: number;
  totalSets: number;
  isCompound: boolean;
}): { min: number; max: number; description: string } {
  const { workoutType, setNumber, totalSets, isCompound } = params;

  if (workoutType === 'deload') {
    return {
      min: 5,
      max: 7,
      description: 'Deload week - keep it light and easy',
    };
  }

  // Last set (AMRAP / max effort)
  if (setNumber === totalSets) {
    if (workoutType === 'strength') {
      return {
        min: 8.5,
        max: 9.5,
        description: 'Final set - push hard but leave 1-2 reps',
      };
    } else {
      return {
        min: 8,
        max: 9,
        description: 'Final set - take it close to failure',
      };
    }
  }

  // Early sets
  if (workoutType === 'strength') {
    if (isCompound) {
      return {
        min: 7.5,
        max: 8.5,
        description: 'Heavy compound - challenging but controlled',
      };
    } else {
      return {
        min: 7,
        max: 8,
        description: 'Accessory work - moderate difficulty',
      };
    }
  } else if (workoutType === 'hypertrophy') {
    if (isCompound) {
      return {
        min: 7,
        max: 8,
        description: 'Hypertrophy - moderate intensity, focus on form',
      };
    } else {
      return {
        min: 7.5,
        max: 8.5,
        description: 'Isolation work - push for muscle growth',
      };
    }
  }

  // Mixed/default
  return {
    min: 7,
    max: 8.5,
    description: 'Moderate to challenging intensity',
  };
}

/**
 * Check if RPE indicates need for rest
 */
export function needsRestDay(rpeWeeklyAverages: RpeWeeklyAverage[]): {
  needsRest: boolean;
  reason: string;
  daysRecommended: number;
} {
  if (rpeWeeklyAverages.length === 0) {
    return {
      needsRest: false,
      reason: 'No RPE data available',
      daysRecommended: 0,
    };
  }

  // Check last 2 weeks
  const recent = rpeWeeklyAverages.slice(-2);

  // Both weeks above 9.0
  if (recent.length >= 2 && recent.every((w) => w.average_rpe >= 9.0)) {
    return {
      needsRest: true,
      reason: 'RPE has been consistently very high (≥9.0) for 2+ weeks',
      daysRecommended: 3,
    };
  }

  // Last week above 9.5
  if (recent[recent.length - 1]?.average_rpe >= 9.5) {
    return {
      needsRest: true,
      reason: 'RPE is extremely high (≥9.5) this week',
      daysRecommended: 2,
    };
  }

  // Trending upward rapidly
  if (recent.length >= 2) {
    const trend = recent[1].average_rpe - recent[0].average_rpe;
    if (trend > 1.0 && recent[1].average_rpe >= 8.5) {
      return {
        needsRest: true,
        reason: 'RPE is increasing rapidly and currently elevated',
        daysRecommended: 1,
      };
    }
  }

  return {
    needsRest: false,
    reason: 'RPE levels are manageable',
    daysRecommended: 0,
  };
}

/**
 * Get fatigue level based on RPE trends
 */
export function assessFatigueLevel(
  rpeWeeklyAverages: RpeWeeklyAverage[]
): 'low' | 'medium' | 'high' {
  if (rpeWeeklyAverages.length === 0) {
    return 'low';
  }

  const recent = rpeWeeklyAverages.slice(-2);
  const avgRpe =
    recent.reduce((sum, w) => sum + w.average_rpe, 0) / recent.length;

  if (avgRpe >= 9.0) {
    return 'high';
  } else if (avgRpe >= 8.0) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Generate auto-regulation insights
 */
export function generateAutoRegulationInsights(params: {
  rpeWeeklyAverages: RpeWeeklyAverage[];
  exerciseName: string;
}): string[] {
  const { rpeWeeklyAverages, exerciseName } = params;
  const insights: string[] = [];

  if (rpeWeeklyAverages.length === 0) {
    return [
      `Start tracking RPE for ${exerciseName} to get personalized recommendations`,
    ];
  }

  const recent = rpeWeeklyAverages.slice(-4); // Last 4 weeks
  const avgRpe = recent.reduce((sum, w) => sum + w.average_rpe, 0) / recent.length;

  // Insight 1: Overall intensity
  if (avgRpe >= 9.0) {
    insights.push(
      `Your average RPE for ${exerciseName} is very high (${avgRpe.toFixed(1)}). Consider deloading.`
    );
  } else if (avgRpe < 7.0) {
    insights.push(
      `Your average RPE for ${exerciseName} is low (${avgRpe.toFixed(1)}). You can likely handle more weight.`
    );
  } else {
    insights.push(
      `Your training intensity for ${exerciseName} is well-balanced (RPE ${avgRpe.toFixed(1)}).`
    );
  }

  // Insight 2: Trend
  if (recent.length >= 2) {
    const trend =
      recent[recent.length - 1].average_rpe - recent[0].average_rpe;

    if (trend > 0.5) {
      insights.push('RPE is trending upward - monitor fatigue closely.');
    } else if (trend < -0.5) {
      insights.push('RPE is decreasing - you may be adapting well to the load.');
    }
  }

  // Insight 3: Consistency
  const rpeVariance = calculateRpeVariance(recent.map((w) => w.average_rpe));

  if (rpeVariance < 0.5) {
    insights.push('Your RPE is very consistent week to week - great control!');
  } else if (rpeVariance > 1.5) {
    insights.push(
      'Your RPE varies significantly between weeks - try to maintain more consistent intensity.'
    );
  }

  return insights;
}

/**
 * Calculate variance in RPE values
 */
function calculateRpeVariance(rpeValues: number[]): number {
  if (rpeValues.length < 2) return 0;

  const mean = rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length;
  const squaredDiffs = rpeValues.map((rpe) => Math.pow(rpe - mean, 2));
  const variance = squaredDiffs.reduce((sum, sq) => sum + sq, 0) / rpeValues.length;

  return Math.sqrt(variance); // Return standard deviation
}

/**
 * Recommend next session weight based on RPE
 */
export function recommendWeightFromRpe(params: {
  lastSessionRpe: number;
  lastSessionWeight: number;
  targetRpe: number;
}): { recommendedWeight: number; reasoning: string } {
  const { lastSessionRpe, lastSessionWeight, targetRpe } = params;

  const rpeDifference = lastSessionRpe - targetRpe;

  // If RPE was too high
  if (rpeDifference > 1.5) {
    const reduction = lastSessionWeight * 0.05; // 5% reduction
    return {
      recommendedWeight: Math.round((lastSessionWeight - reduction) / 2.5) * 2.5,
      reasoning: `Last session RPE was too high (${lastSessionRpe}). Reducing weight by ~5%.`,
    };
  }

  // If RPE was too low
  if (rpeDifference < -1.5) {
    const increase = 5; // Add 5kg
    return {
      recommendedWeight: lastSessionWeight + increase,
      reasoning: `Last session RPE was low (${lastSessionRpe}). Adding 5kg.`,
    };
  }

  // If RPE was slightly low
  if (rpeDifference < -0.5) {
    const increase = 2.5; // Add 2.5kg
    return {
      recommendedWeight: lastSessionWeight + increase,
      reasoning: `Last session RPE was manageable (${lastSessionRpe}). Adding 2.5kg.`,
    };
  }

  // Perfect range
  return {
    recommendedWeight: lastSessionWeight,
    reasoning: `Last session RPE was perfect (${lastSessionRpe}). Maintaining weight.`,
  };
}
