// Achievement Checking and Progress Utilities

import { Achievement, UserAchievementProgress } from './types';

export interface AchievementCheckResult {
  achievement: Achievement;
  unlocked: boolean;
  progress: number;
  previousProgress: number;
}

/**
 * Check if weight-based achievement is unlocked
 */
export function checkWeightAchievement(
  achievement: Achievement,
  currentWeight: number,
  exerciseName: string
): boolean {
  if (achievement.requirement_type !== 'weight') return false;
  if (achievement.exercise_name && achievement.exercise_name !== exerciseName)
    return false;

  return currentWeight >= (achievement.requirement_value || 0);
}

/**
 * Check if streak-based achievement is unlocked
 */
export function checkStreakAchievement(
  achievement: Achievement,
  currentStreak: number
): boolean {
  if (achievement.requirement_type !== 'streak') return false;
  return currentStreak >= (achievement.requirement_value || 0);
}

/**
 * Check if volume-based achievement is unlocked
 */
export function checkVolumeAchievement(
  achievement: Achievement,
  totalVolume: number
): boolean {
  if (achievement.requirement_type !== 'volume') return false;
  return totalVolume >= (achievement.requirement_value || 0);
}

/**
 * Check if count-based achievement is unlocked
 */
export function checkCountAchievement(
  achievement: Achievement,
  count: number
): boolean {
  if (achievement.requirement_type !== 'count') return false;
  return count >= (achievement.requirement_value || 0);
}

/**
 * Check if time-based achievement is unlocked
 */
export function checkTimeAchievement(
  achievement: Achievement,
  workoutHour: number
): boolean {
  if (achievement.requirement_type !== 'time') return false;
  const requiredHour = achievement.requirement_value || 0;

  // Check if it's before or after the required hour
  if (achievement.code === 'early_bird') {
    return workoutHour < requiredHour;
  } else if (achievement.code === 'midnight_grinder') {
    return workoutHour >= requiredHour;
  }

  return false;
}

/**
 * Check if power rating achievement is unlocked
 */
export function checkPowerRatingAchievement(
  achievement: Achievement,
  powerRating: number
): boolean {
  if (achievement.requirement_type !== 'power_rating') return false;
  return powerRating >= (achievement.requirement_value || 0);
}

/**
 * Check if ratio-based achievement is unlocked (e.g., bodyweight multipliers)
 */
export function checkRatioAchievement(
  achievement: Achievement,
  weight: number,
  bodyweight: number
): boolean {
  if (achievement.requirement_type !== 'ratio') return false;
  if (bodyweight === 0) return false;

  const ratio = weight / bodyweight;
  return ratio >= (achievement.requirement_value || 0);
}

/**
 * Calculate progress percentage for an achievement
 */
export function calculateAchievementProgress(
  achievement: Achievement,
  currentValue: number,
  bodyweight?: number
): number {
  const targetValue = achievement.requirement_value || 1;

  switch (achievement.requirement_type) {
    case 'ratio':
      if (!bodyweight || bodyweight === 0) return 0;
      return Math.min(100, (currentValue / bodyweight / targetValue) * 100);

    case 'weight':
    case 'streak':
    case 'volume':
    case 'count':
    case 'power_rating':
      return Math.min(100, (currentValue / targetValue) * 100);

    case 'time':
      // Time-based achievements are binary (either achieved or not)
      return 0;

    default:
      return 0;
  }
}

/**
 * Get all newly unlocked achievements from a workout session
 */
export function checkSessionAchievements(
  achievements: Achievement[],
  userProgress: UserAchievementProgress[],
  sessionData: {
    exercises: Array<{
      name: string;
      maxWeight: number;
    }>;
    totalVolume: number;
    setCount: number;
    repCount: number;
    currentStreak: number;
    workoutHour: number;
    prCount: number;
    bodyweight?: number;
  }
): AchievementCheckResult[] {
  const results: AchievementCheckResult[] = [];

  for (const achievement of achievements) {
    const existingProgress = userProgress.find(
      (p) => p.achievement_id === achievement.id
    );

    // Skip if already unlocked
    if (existingProgress?.is_unlocked) continue;

    let unlocked = false;
    let progress = existingProgress?.current_progress || 0;
    const previousProgress = progress;

    switch (achievement.requirement_type) {
      case 'weight':
        for (const exercise of sessionData.exercises) {
          if (
            !achievement.exercise_name ||
            achievement.exercise_name === exercise.name
          ) {
            unlocked = checkWeightAchievement(
              achievement,
              exercise.maxWeight,
              exercise.name
            );
            progress = calculateAchievementProgress(
              achievement,
              exercise.maxWeight
            );
            if (unlocked) break;
          }
        }
        break;

      case 'streak':
        unlocked = checkStreakAchievement(
          achievement,
          sessionData.currentStreak
        );
        progress = calculateAchievementProgress(
          achievement,
          sessionData.currentStreak
        );
        break;

      case 'volume':
        unlocked = checkVolumeAchievement(
          achievement,
          sessionData.totalVolume
        );
        progress = calculateAchievementProgress(
          achievement,
          sessionData.totalVolume
        );
        break;

      case 'count':
        let countValue = 0;
        if (achievement.code.includes('workout')) {
          countValue = sessionData.setCount;
        } else if (achievement.code.includes('rep')) {
          countValue = sessionData.repCount;
        } else if (achievement.code.includes('pr')) {
          countValue = sessionData.prCount;
        }
        unlocked = checkCountAchievement(achievement, countValue);
        progress = calculateAchievementProgress(achievement, countValue);
        break;

      case 'time':
        unlocked = checkTimeAchievement(achievement, sessionData.workoutHour);
        progress = unlocked ? 100 : 0;
        break;

      case 'ratio':
        if (sessionData.bodyweight) {
          for (const exercise of sessionData.exercises) {
            if (
              !achievement.exercise_name ||
              achievement.exercise_name === exercise.name
            ) {
              unlocked = checkRatioAchievement(
                achievement,
                exercise.maxWeight,
                sessionData.bodyweight
              );
              progress = calculateAchievementProgress(
                achievement,
                exercise.maxWeight,
                sessionData.bodyweight
              );
              if (unlocked) break;
            }
          }
        }
        break;
    }

    if (unlocked || progress !== previousProgress) {
      results.push({
        achievement,
        unlocked,
        progress,
        previousProgress,
      });
    }
  }

  return results;
}

/**
 * Group achievements by category for display
 */
export function groupAchievementsByCategory(
  achievements: Achievement[]
): Record<string, Achievement[]> {
  return achievements.reduce((acc, achievement) => {
    const category = achievement.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);
}

/**
 * Get icon for achievement category
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    strength: 'Dumbbell',
    consistency: 'Calendar',
    volume: 'Weight',
    progression: 'TrendingUp',
    special: 'Star',
    boss: 'Sword',
  };

  return icons[category] || 'Award';
}

/**
 * Sort achievements by unlock priority
 */
export function sortAchievementsByPriority(
  achievements: Achievement[]
): Achievement[] {
  const tierPriority: Record<string, number> = {
    legendary: 5,
    platinum: 4,
    gold: 3,
    silver: 2,
    bronze: 1,
  };

  return [...achievements].sort((a, b) => {
    // First sort by tier (highest first)
    const tierDiff =
      tierPriority[b.tier] - tierPriority[a.tier];
    if (tierDiff !== 0) return tierDiff;

    // Then by XP reward (highest first)
    return b.xp_reward - a.xp_reward;
  });
}
