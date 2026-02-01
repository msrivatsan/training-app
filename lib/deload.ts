/**
 * Deload Scheduler Utilities
 *
 * Manages automatic deload scheduling and volume reduction
 */

import type { DeloadSchedule, DeloadScheduleInsert, RpeWeeklyAverage } from './types';

/**
 * Calculate if a deload is needed based on various factors
 */
export function shouldScheduleDeload(params: {
  weeksSinceLastDeload: number;
  averageRpe?: number;
  consecutiveHighRpeWeeks?: number;
  userFatigueLevel?: 'low' | 'medium' | 'high';
}): { needed: boolean; reason: string; urgency: 'low' | 'medium' | 'high' } {
  const { weeksSinceLastDeload, averageRpe, consecutiveHighRpeWeeks, userFatigueLevel } = params;

  // Rule 1: Standard 4-5 week schedule
  if (weeksSinceLastDeload >= 5) {
    return {
      needed: true,
      reason: 'Standard deload cycle (5 weeks of training)',
      urgency: 'high',
    };
  }

  // Rule 2: High RPE for 2+ weeks
  if (averageRpe && averageRpe >= 9.0 && consecutiveHighRpeWeeks && consecutiveHighRpeWeeks >= 2) {
    return {
      needed: true,
      reason: 'RPE consistently above 9 for 2+ weeks',
      urgency: 'high',
    };
  }

  // Rule 3: User-reported high fatigue
  if (userFatigueLevel === 'high') {
    return {
      needed: true,
      reason: 'User-reported high fatigue levels',
      urgency: 'medium',
    };
  }

  // Rule 4: Approaching scheduled deload (warning)
  if (weeksSinceLastDeload >= 4) {
    return {
      needed: false,
      reason: 'Approaching scheduled deload week',
      urgency: 'low',
    };
  }

  // Rule 5: Moderate RPE elevation
  if (averageRpe && averageRpe >= 8.5 && consecutiveHighRpeWeeks && consecutiveHighRpeWeeks >= 1) {
    return {
      needed: false,
      reason: 'RPE slightly elevated - monitor closely',
      urgency: 'low',
    };
  }

  return {
    needed: false,
    reason: 'No deload needed - training load is manageable',
    urgency: 'low',
  };
}

/**
 * Calculate deload volume reduction percentage
 *
 * Default is 40%, but can be adjusted based on fatigue level
 */
export function calculateDeloadReduction(params: {
  fatigueLevel?: 'low' | 'medium' | 'high';
  averageRpe?: number;
  isManualDeload?: boolean;
}): number {
  const { fatigueLevel, averageRpe, isManualDeload } = params;

  // Manual deloads use standard 40%
  if (isManualDeload) {
    return 40;
  }

  // High fatigue or very high RPE → 50% reduction
  if (fatigueLevel === 'high' || (averageRpe && averageRpe >= 9.5)) {
    return 50;
  }

  // Medium fatigue or high RPE → 40% reduction (standard)
  if (fatigueLevel === 'medium' || (averageRpe && averageRpe >= 9.0)) {
    return 40;
  }

  // Low fatigue → 30% reduction (lighter deload)
  if (fatigueLevel === 'low' || (averageRpe && averageRpe < 8.5)) {
    return 30;
  }

  // Default
  return 40;
}

/**
 * Calculate deload week dates
 *
 * Returns the Monday-Sunday of the deload week
 */
export function calculateDeloadWeekDates(weeksFromNow: number): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();

  // Calculate the start of the deload week (Monday)
  const daysUntilNextMonday = ((1 - now.getDay() + 7) % 7) || 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilNextMonday);

  // Add weeks
  const deloadStartDate = new Date(nextMonday);
  deloadStartDate.setDate(nextMonday.getDate() + weeksFromNow * 7);

  // End date is 6 days later (Sunday)
  const deloadEndDate = new Date(deloadStartDate);
  deloadEndDate.setDate(deloadStartDate.getDate() + 6);

  return {
    startDate: deloadStartDate,
    endDate: deloadEndDate,
  };
}

/**
 * Get notification timing for upcoming deload
 *
 * Notify 1 week in advance
 */
export function getDeloadNotificationDate(deloadStartDate: Date): Date {
  const notificationDate = new Date(deloadStartDate);
  notificationDate.setDate(deloadStartDate.getDate() - 7);
  return notificationDate;
}

/**
 * Check if user should be notified about upcoming deload
 */
export function shouldNotifyDeload(deload: DeloadSchedule): boolean {
  if (deload.status !== 'upcoming') {
    return false; // Only notify for upcoming deloads
  }

  if (deload.notified_at) {
    return false; // Already notified
  }

  const now = new Date();
  const deloadStart = new Date(deload.scheduled_week_start);
  const notificationDate = getDeloadNotificationDate(deloadStart);

  return now >= notificationDate;
}

/**
 * Calculate adjusted sets for deload week
 */
export function calculateDeloadSets(
  normalSets: number,
  volumeReductionPercent: number
): number {
  const reduction = volumeReductionPercent / 100;
  const deloadSets = Math.ceil(normalSets * (1 - reduction));

  // Ensure at least 1 set
  return Math.max(1, deloadSets);
}

/**
 * Generate deload workout parameters
 *
 * Reduces volume (sets) but keeps weights the same
 */
export function generateDeloadWorkoutParams(params: {
  normalSets: number;
  normalReps: number;
  normalWeight: number;
  volumeReductionPercent: number;
}): {
  deloadSets: number;
  deloadReps: number;
  deloadWeight: number;
  volumeReductionActual: number;
} {
  const { normalSets, normalReps, normalWeight, volumeReductionPercent } = params;

  // Calculate deload sets
  const deloadSets = calculateDeloadSets(normalSets, volumeReductionPercent);

  // Keep reps and weight the same
  const deloadReps = normalReps;
  const deloadWeight = normalWeight;

  // Calculate actual volume reduction achieved
  const normalVolume = normalSets * normalReps * normalWeight;
  const deloadVolume = deloadSets * deloadReps * deloadWeight;
  const volumeReductionActual = Math.round(
    ((normalVolume - deloadVolume) / normalVolume) * 100
  );

  return {
    deloadSets,
    deloadReps,
    deloadWeight,
    volumeReductionActual,
  };
}

/**
 * Check if current date is within deload week
 */
export function isInDeloadWeek(deload: DeloadSchedule): boolean {
  const now = new Date();
  const startDate = new Date(deload.scheduled_week_start);
  const endDate = new Date(deload.scheduled_week_end);

  return now >= startDate && now <= endDate;
}

/**
 * Get active deload for current week
 */
export function getActiveDeload(deloads: DeloadSchedule[]): DeloadSchedule | null {
  const now = new Date();

  for (const deload of deloads) {
    if (deload.status === 'active' || isInDeloadWeek(deload)) {
      return deload;
    }
  }

  return null;
}

/**
 * Format deload status message
 */
export function getDeloadStatusMessage(deload: DeloadSchedule): string {
  const startDate = new Date(deload.scheduled_week_start);
  const endDate = new Date(deload.scheduled_week_end);
  const now = new Date();

  if (deload.status === 'completed') {
    return 'Deload completed';
  }

  if (deload.status === 'skipped') {
    return 'Deload skipped';
  }

  if (deload.status === 'active' || isInDeloadWeek(deload)) {
    return `Deload Week (${deload.volume_reduction_percent}% volume reduction)`;
  }

  // Calculate days until deload
  const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil <= 7) {
    return `Deload in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
  }

  if (daysUntil <= 14) {
    return `Deload in ${Math.ceil(daysUntil / 7)} week${daysUntil <= 7 ? '' : 's'}`;
  }

  return 'Deload upcoming';
}

/**
 * Analyze RPE trends to determine if deload is needed
 */
export function analyzeRpeTrends(rpeWeeklyAverages: RpeWeeklyAverage[]): {
  shouldDeload: boolean;
  reason: string;
  consecutiveHighWeeks: number;
  trend: 'increasing' | 'decreasing' | 'stable';
} {
  if (rpeWeeklyAverages.length === 0) {
    return {
      shouldDeload: false,
      reason: 'No RPE data available',
      consecutiveHighWeeks: 0,
      trend: 'stable',
    };
  }

  // Sort by week start date (most recent first)
  const sortedData = [...rpeWeeklyAverages].sort(
    (a, b) =>
      new Date(b.week_start_date).getTime() - new Date(a.week_start_date).getTime()
  );

  // Count consecutive high RPE weeks (>= 9.0)
  let consecutiveHighWeeks = 0;
  for (const week of sortedData) {
    if (week.average_rpe >= 9.0) {
      consecutiveHighWeeks++;
    } else {
      break;
    }
  }

  // Determine trend (last 3 weeks)
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (sortedData.length >= 3) {
    const recent = sortedData.slice(0, 3);
    const avgFirst = recent[2].average_rpe;
    const avgLast = recent[0].average_rpe;
    const change = avgLast - avgFirst;

    if (change > 0.5) {
      trend = 'increasing';
    } else if (change < -0.5) {
      trend = 'decreasing';
    }
  }

  // Determine if deload is needed
  let shouldDeload = false;
  let reason = 'RPE levels are manageable';

  if (consecutiveHighWeeks >= 2) {
    shouldDeload = true;
    reason = `RPE has been high (≥9.0) for ${consecutiveHighWeeks} consecutive weeks`;
  } else if (trend === 'increasing' && sortedData[0].average_rpe >= 8.5) {
    shouldDeload = true;
    reason = 'RPE is trending upward and currently elevated';
  }

  return {
    shouldDeload,
    reason,
    consecutiveHighWeeks,
    trend,
  };
}
