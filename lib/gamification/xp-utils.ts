// XP and Leveling Utility Functions

import {
  LevelInfo,
  LevelTier,
  LEVEL_THRESHOLDS,
  XP_REWARDS,
  PRIORITY_LIFTS,
  XpType,
  AchievementTier,
  ACHIEVEMENT_TIER_XP,
} from './types';

/**
 * Calculate level, XP to next level, and title from total XP
 */
export function calculateLevel(totalXp: number): LevelInfo {
  let level = 1;
  let xpToNext = 200;
  let title: LevelTier = 'Novice Lifter';

  if (totalXp < LEVEL_THRESHOLDS.NOVICE.xpMax) {
    // Levels 1-10: 0-2,000 XP (200 XP per level)
    level = 1 + Math.floor(totalXp / 200);
    xpToNext = level * 200 - totalXp;
    title = 'Novice Lifter';
  } else if (totalXp < LEVEL_THRESHOLDS.INTERMEDIATE.xpMax) {
    // Levels 11-25: 2,000-10,000 XP (~533 XP per level)
    level = 11 + Math.floor((totalXp - 2000) / 533);
    xpToNext = 2000 + (level - 10) * 533 - totalXp;
    title = 'Intermediate Athlete';
  } else if (totalXp < LEVEL_THRESHOLDS.ADVANCED.xpMax) {
    // Levels 26-40: 10,000-30,000 XP (~1,333 XP per level)
    level = 26 + Math.floor((totalXp - 10000) / 1333);
    xpToNext = 10000 + (level - 25) * 1333 - totalXp;
    title = 'Advanced Lifter';
  } else if (totalXp < LEVEL_THRESHOLDS.ELITE.xpMax) {
    // Levels 41-60: 30,000-100,000 XP (~3,500 XP per level)
    level = 41 + Math.floor((totalXp - 30000) / 3500);
    xpToNext = 30000 + (level - 40) * 3500 - totalXp;
    title = 'Elite Strength';
  } else {
    // Levels 61+: 100,000+ XP (~10,000 XP per level)
    level = 61 + Math.floor((totalXp - 100000) / 10000);
    xpToNext = 100000 + (level - 60) * 10000 - totalXp;
    title = 'Legendary';
  }

  // Calculate percentage to next level
  const currentLevelXp = totalXp - (totalXp - xpToNext);
  const xpForCurrentLevel = getXpForLevel(level);
  const percentageToNext = Math.min(
    100,
    Math.floor((currentLevelXp / xpForCurrentLevel) * 100)
  );

  return {
    level,
    xp_to_next: xpToNext,
    title,
    percentage_to_next: percentageToNext,
  };
}

/**
 * Get XP required for a specific level
 */
function getXpForLevel(level: number): number {
  if (level <= 10) return 200;
  if (level <= 25) return 533;
  if (level <= 40) return 1333;
  if (level <= 60) return 3500;
  return 10000;
}

/**
 * Calculate XP for completing a set
 */
export function calculateSetXp(exerciseName: string): number {
  const baseXp = XP_REWARDS.set_complete;
  const isPriorityLift = PRIORITY_LIFTS.includes(exerciseName);
  return isPriorityLift ? baseXp * 2 : baseXp;
}

/**
 * Calculate XP for completing a workout
 */
export function calculateWorkoutXp(
  setCount: number,
  exerciseNames: string[]
): number {
  const baseXp = XP_REWARDS.workout_complete;

  // Bonus XP for longer workouts
  let bonusXp = 0;
  if (setCount >= 20) bonusXp += 50;
  if (setCount >= 30) bonusXp += 50;
  if (setCount >= 40) bonusXp += 100;

  // Bonus XP for exercise variety
  const uniqueExercises = new Set(exerciseNames).size;
  if (uniqueExercises >= 5) bonusXp += 25;
  if (uniqueExercises >= 8) bonusXp += 50;

  return baseXp + bonusXp;
}

/**
 * Calculate XP for breaking a PR
 */
export function calculatePrXp(
  exerciseName: string,
  improvement: number
): number {
  const baseXp = XP_REWARDS.pr_broken;
  const isPriorityLift = PRIORITY_LIFTS.includes(exerciseName);

  // Bonus for significant improvements
  let multiplier = 1;
  if (improvement >= 5) multiplier = 1.2;
  if (improvement >= 10) multiplier = 1.5;
  if (improvement >= 20) multiplier = 2.0;

  return Math.floor(
    baseXp * multiplier * (isPriorityLift ? 1.5 : 1)
  );
}

/**
 * Calculate XP for streak milestones
 */
export function calculateStreakMilestoneXp(streakDays: number): number {
  const milestoneXp: Record<number, number> = {
    7: 50,
    14: 100,
    30: 250,
    60: 500,
    90: 750,
    180: 1000,
    365: 2000,
  };

  return milestoneXp[streakDays] || 0;
}

/**
 * Get level badge color based on tier
 */
export function getLevelBadgeColor(title: LevelTier): string {
  const colors: Record<LevelTier, string> = {
    'Novice Lifter': 'bg-gray-500',
    'Intermediate Athlete': 'bg-blue-500',
    'Advanced Lifter': 'bg-purple-500',
    'Elite Strength': 'bg-amber-500',
    'Legendary': 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-500',
  };

  return colors[title] || 'bg-gray-500';
}

/**
 * Get achievement tier color
 */
export function getAchievementTierColor(tier: AchievementTier): string {
  const colors: Record<AchievementTier, string> = {
    bronze: 'text-orange-700 bg-orange-100 border-orange-300',
    silver: 'text-gray-700 bg-gray-100 border-gray-400',
    gold: 'text-yellow-700 bg-yellow-100 border-yellow-400',
    platinum: 'text-cyan-700 bg-cyan-100 border-cyan-400',
    legendary:
      'text-purple-700 bg-gradient-to-r from-purple-200 to-pink-200 border-purple-500',
  };

  return colors[tier] || 'text-gray-700 bg-gray-100 border-gray-300';
}

/**
 * Get XP for achievement unlock
 */
export function getAchievementXp(tier: AchievementTier): number {
  return ACHIEVEMENT_TIER_XP[tier];
}

/**
 * Format XP number with commas
 */
export function formatXp(xp: number): string {
  return xp.toLocaleString();
}

/**
 * Calculate total XP from level
 */
export function getTotalXpForLevel(level: number): number {
  if (level <= 10) return (level - 1) * 200;
  if (level <= 25) return 2000 + (level - 11) * 533;
  if (level <= 40) return 10000 + (level - 26) * 1333;
  if (level <= 60) return 30000 + (level - 41) * 3500;
  return 100000 + (level - 61) * 10000;
}
