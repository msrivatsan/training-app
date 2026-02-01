/**
 * Performance Predictor Utilities
 *
 * Predicts 1RM, tracks milestones, and estimates achievement dates
 */

import type {
  Set,
  PerformancePrediction,
  MilestoneTracking,
  StrengthCurvePoint,
} from './types';

/**
 * Calculate 1RM using multiple formulas and return weighted average
 */
export function predict1RM(
  weight: number,
  reps: number,
  method: 'epley' | 'brzycki' | 'lombardi' | 'weighted_average' = 'weighted_average'
): number {
  if (reps === 1) return weight;

  const epley = weight * (1 + reps / 30);
  const brzycki = weight * (36 / (37 - reps));
  const lombardi = weight * Math.pow(reps, 0.1);

  switch (method) {
    case 'epley':
      return Math.round(epley);
    case 'brzycki':
      return Math.round(brzycki);
    case 'lombardi':
      return Math.round(lombardi);
    case 'weighted_average':
      // Weight formulas: Epley 50%, Brzycki 30%, Lombardi 20%
      const weighted = epley * 0.5 + brzycki * 0.3 + lombardi * 0.2;
      return Math.round(weighted);
    default:
      return Math.round(epley);
  }
}

/**
 * Calculate confidence score for 1RM prediction
 *
 * Higher confidence for:
 * - More data points
 * - Reps in the 3-8 range (sweet spot for estimation)
 * - Recent data
 */
export function calculatePredictionConfidence(params: {
  sessionsCount: number;
  averageReps: number;
  daysSinceLastSession: number;
}): number {
  const { sessionsCount, averageReps, daysSinceLastSession } = params;

  let confidence = 0.5; // Base confidence

  // Sessions count factor (max +0.3)
  if (sessionsCount >= 10) {
    confidence += 0.3;
  } else if (sessionsCount >= 5) {
    confidence += 0.2;
  } else if (sessionsCount >= 3) {
    confidence += 0.1;
  }

  // Rep range factor (max +0.2)
  // Sweet spot is 3-8 reps for 1RM estimation
  if (averageReps >= 3 && averageReps <= 8) {
    confidence += 0.2;
  } else if (averageReps >= 2 && averageReps <= 10) {
    confidence += 0.1;
  }

  // Recency factor (max -0.3 penalty)
  if (daysSinceLastSession > 30) {
    confidence -= 0.3;
  } else if (daysSinceLastSession > 14) {
    confidence -= 0.2;
  } else if (daysSinceLastSession > 7) {
    confidence -= 0.1;
  }

  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Generate strength curve data from historical sets
 */
export function generateStrengthCurve(
  sets: Array<Set & { created_at: string }>
): StrengthCurvePoint[] {
  // Group sets by date
  const setsByDate = new Map<string, Array<Set>>();

  for (const set of sets) {
    if (set.is_warmup) continue; // Skip warmup sets

    const date = new Date(set.created_at).toISOString().split('T')[0];

    if (!setsByDate.has(date)) {
      setsByDate.set(date, []);
    }

    setsByDate.get(date)!.push(set);
  }

  // Calculate 1RM estimate for each date
  const curvePoints: StrengthCurvePoint[] = [];

  for (const [date, dateSets] of setsByDate) {
    // Find best set (highest weight × reps score)
    let bestSet: Set | null = null;
    let bestScore = 0;

    for (const set of dateSets) {
      const score = set.weight_kg * set.reps;
      if (score > bestScore) {
        bestScore = score;
        bestSet = set;
      }
    }

    if (bestSet) {
      const estimated1RM = predict1RM(bestSet.weight_kg, bestSet.reps);

      // Calculate confidence based on rep range
      let confidence = 0.7; // Base confidence
      if (bestSet.reps >= 3 && bestSet.reps <= 8) {
        confidence = 0.9;
      } else if (bestSet.reps === 1) {
        confidence = 1.0; // Actual 1RM
      } else if (bestSet.reps > 12) {
        confidence = 0.5; // Less accurate for high reps
      }

      curvePoints.push({
        date,
        estimated_1rm_kg: estimated1RM,
        actual_weight_kg: bestSet.weight_kg,
        reps: bestSet.reps,
        confidence,
      });
    }
  }

  // Sort by date
  return curvePoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Predict when a user will achieve a milestone weight
 */
export function predictMilestoneAchievement(params: {
  strengthCurve: StrengthCurvePoint[];
  targetWeight: number;
  targetReps?: number;
}): {
  predictedDate: Date | null;
  weeksToAchievement: number | null;
  achievementProbability: number;
  currentEstimated1RM: number | null;
} {
  const { strengthCurve, targetWeight, targetReps = 1 } = params;

  if (strengthCurve.length === 0) {
    return {
      predictedDate: null,
      weeksToAchievement: null,
      achievementProbability: 0,
      currentEstimated1RM: null,
    };
  }

  // Get current estimated 1RM (most recent point)
  const currentPoint = strengthCurve[strengthCurve.length - 1];
  const currentEstimated1RM = currentPoint.estimated_1rm_kg;

  // Calculate weight needed at 1RM to hit target at target reps
  const required1RM =
    targetReps === 1 ? targetWeight : predict1RM(targetWeight, targetReps);

  // If already achieved
  if (currentEstimated1RM >= required1RM) {
    return {
      predictedDate: new Date(),
      weeksToAchievement: 0,
      achievementProbability: 1.0,
      currentEstimated1RM,
    };
  }

  // Calculate progression rate (kg per week)
  const progressionRate = calculateProgressionRate(strengthCurve);

  if (progressionRate <= 0) {
    // No progression or regressing
    return {
      predictedDate: null,
      weeksToAchievement: null,
      achievementProbability: 0,
      currentEstimated1RM,
    };
  }

  // Calculate weeks needed
  const weightToGain = required1RM - currentEstimated1RM;
  const weeksToAchievement = Math.ceil(weightToGain / progressionRate);

  // Calculate predicted date
  const predictedDate = new Date();
  predictedDate.setDate(predictedDate.getDate() + weeksToAchievement * 7);

  // Calculate achievement probability
  // Based on:
  // - Consistency of progression
  // - How far the target is
  // - Recent trend
  const achievementProbability = calculateAchievementProbability({
    strengthCurve,
    progressionRate,
    weightToGain,
    weeksToAchievement,
  });

  return {
    predictedDate,
    weeksToAchievement,
    achievementProbability,
    currentEstimated1RM,
  };
}

/**
 * Calculate average progression rate in kg per week
 */
function calculateProgressionRate(strengthCurve: StrengthCurvePoint[]): number {
  if (strengthCurve.length < 2) {
    return 0;
  }

  // Use linear regression to calculate trend
  const points = strengthCurve.map((point, index) => ({
    x: index, // Time index
    y: point.estimated_1rm_kg,
  }));

  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);

  // Calculate slope (kg per data point)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // Convert to kg per week
  // Estimate average days between data points
  const firstDate = new Date(strengthCurve[0].date);
  const lastDate = new Date(strengthCurve[n - 1].date);
  const totalDays = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
  const daysPerPoint = totalDays / (n - 1);
  const weeksPerPoint = daysPerPoint / 7;

  const kgPerWeek = weeksPerPoint > 0 ? slope / weeksPerPoint : slope;

  return Math.max(0, kgPerWeek); // Don't return negative rates
}

/**
 * Calculate probability of achieving milestone
 */
function calculateAchievementProbability(params: {
  strengthCurve: StrengthCurvePoint[];
  progressionRate: number;
  weightToGain: number;
  weeksToAchievement: number;
}): number {
  const { strengthCurve, progressionRate, weightToGain, weeksToAchievement } = params;

  let probability = 0.5; // Base 50%

  // Factor 1: Consistency of progression (+0.3)
  const consistency = calculateProgressionConsistency(strengthCurve);
  probability += consistency * 0.3;

  // Factor 2: Reasonableness of timeline (+0.2)
  // More achievable if timeline is reasonable (not too ambitious)
  if (weeksToAchievement >= 4 && weeksToAchievement <= 26) {
    probability += 0.2; // 1-6 months is reasonable
  } else if (weeksToAchievement < 4) {
    probability -= 0.2; // Too ambitious
  } else if (weeksToAchievement > 52) {
    probability -= 0.1; // Very long timeline
  }

  // Factor 3: Size of gain relative to current strength (-0.2 to +0.1)
  const currentEstimated1RM = strengthCurve[strengthCurve.length - 1].estimated_1rm_kg;
  const percentGain = (weightToGain / currentEstimated1RM) * 100;

  if (percentGain < 5) {
    probability += 0.1; // Small, very achievable gain
  } else if (percentGain > 20) {
    probability -= 0.2; // Very large gain
  }

  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, probability));
}

/**
 * Calculate how consistent the progression has been
 *
 * Returns 0 to 1, where 1 is very consistent upward trend
 */
function calculateProgressionConsistency(strengthCurve: StrengthCurvePoint[]): number {
  if (strengthCurve.length < 3) {
    return 0.5; // Not enough data
  }

  // Count how many times the estimated 1RM increased vs decreased
  let increases = 0;
  let decreases = 0;

  for (let i = 1; i < strengthCurve.length; i++) {
    const prev = strengthCurve[i - 1].estimated_1rm_kg;
    const curr = strengthCurve[i].estimated_1rm_kg;

    if (curr > prev) {
      increases++;
    } else if (curr < prev) {
      decreases++;
    }
  }

  const total = increases + decreases;
  if (total === 0) return 0.5;

  // Return ratio of increases
  return increases / total;
}

/**
 * Get next milestone suggestions based on current 1RM
 */
export function suggestMilestones(
  exerciseName: string,
  currentEstimated1RM: number
): Array<{ weight: number; description: string }> {
  const milestones: Array<{ weight: number; description: string }> = [];

  // Round current 1RM to nearest 5kg
  const roundedCurrent = Math.ceil(currentEstimated1RM / 5) * 5;

  // Suggest milestones at intervals
  const intervals = [5, 10, 20, 30, 40, 50]; // kg

  for (const interval of intervals) {
    const milestone = roundedCurrent + interval;

    // Special milestones (100kg plates, etc.)
    let description = `${milestone}kg ${exerciseName}`;

    if (milestone % 100 === 0) {
      description = `🎯 ${milestone}kg ${exerciseName} - Major milestone!`;
    } else if (milestone === 60 || milestone === 80) {
      description = `${milestone}kg ${exerciseName} - Nice round number`;
    }

    milestones.push({
      weight: milestone,
      description,
    });

    // Stop at 6 suggestions
    if (milestones.length >= 6) break;
  }

  return milestones;
}

/**
 * Calculate monthly strength gain
 */
export function calculateMonthlyGain(strengthCurve: StrengthCurvePoint[]): {
  gainKg: number;
  gainPercent: number;
  trend: 'increasing' | 'decreasing' | 'stable';
} {
  if (strengthCurve.length === 0) {
    return {
      gainKg: 0,
      gainPercent: 0,
      trend: 'stable',
    };
  }

  // Get data from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentPoints = strengthCurve.filter(
    (point) => new Date(point.date) >= thirtyDaysAgo
  );

  if (recentPoints.length < 2) {
    return {
      gainKg: 0,
      gainPercent: 0,
      trend: 'stable',
    };
  }

  const firstPoint = recentPoints[0];
  const lastPoint = recentPoints[recentPoints.length - 1];

  const gainKg = lastPoint.estimated_1rm_kg - firstPoint.estimated_1rm_kg;
  const gainPercent = (gainKg / firstPoint.estimated_1rm_kg) * 100;

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (gainKg > 2) {
    trend = 'increasing';
  } else if (gainKg < -2) {
    trend = 'decreasing';
  }

  return {
    gainKg: Math.round(gainKg * 10) / 10,
    gainPercent: Math.round(gainPercent * 10) / 10,
    trend,
  };
}

/**
 * Generate projection for strength curve (next 12 weeks)
 */
export function projectStrengthCurve(
  strengthCurve: StrengthCurvePoint[],
  weeksAhead: number = 12
): StrengthCurvePoint[] {
  if (strengthCurve.length < 2) {
    return [];
  }

  const progressionRate = calculateProgressionRate(strengthCurve);
  const lastPoint = strengthCurve[strengthCurve.length - 1];
  const lastDate = new Date(lastPoint.date);

  const projections: StrengthCurvePoint[] = [];

  for (let week = 1; week <= weeksAhead; week++) {
    const projectedDate = new Date(lastDate);
    projectedDate.setDate(lastDate.getDate() + week * 7);

    const projectedWeight = lastPoint.estimated_1rm_kg + progressionRate * week;

    // Confidence decreases over time
    const baseConfidence = 0.7;
    const confidenceDecay = week * 0.05; // Lose 5% confidence per week
    const confidence = Math.max(0.2, baseConfidence - confidenceDecay);

    projections.push({
      date: projectedDate.toISOString().split('T')[0],
      estimated_1rm_kg: Math.round(projectedWeight),
      confidence,
    });
  }

  return projections;
}
