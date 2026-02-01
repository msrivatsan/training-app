// Gamification System Types

export type XpType =
  | 'set_complete'
  | 'workout_complete'
  | 'pr_broken'
  | 'streak_milestone'
  | 'perfect_form'
  | 'boss_battle'
  | 'achievement';

export type AchievementCategory =
  | 'strength'
  | 'consistency'
  | 'volume'
  | 'progression'
  | 'special'
  | 'boss';

export type AchievementTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'legendary';

export type RequirementType =
  | 'weight'
  | 'streak'
  | 'volume'
  | 'count'
  | 'time'
  | 'ratio'
  | 'power_rating';

export type RewardType =
  | 'theme'
  | 'exercise_variation'
  | 'analytics_feature'
  | 'trophy';

export type BossDifficulty = 'normal' | 'hard' | 'nightmare';

export type ChallengeType =
  | 'weight_target'
  | 'volume_target'
  | 'streak_target'
  | 'pr_count';

export type LevelTier =
  | 'Novice Lifter'
  | 'Intermediate Athlete'
  | 'Advanced Lifter'
  | 'Elite Strength'
  | 'Legendary';

export interface UserLevel {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  title: LevelTier;
  created_at: string;
  updated_at: string;
}

export interface XpTransaction {
  id: string;
  user_id: string;
  session_id?: string;
  xp_amount: number;
  xp_type: XpType;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  xp_reward: number;
  icon?: string;
  requirement_type: RequirementType;
  requirement_value?: number;
  exercise_name?: string;
  is_secret: boolean;
  created_at: string;
}

export interface UserAchievementProgress {
  id: string;
  user_id: string;
  achievement_id: string;
  achievement?: Achievement;
  current_progress: number;
  is_unlocked: boolean;
  unlocked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StrengthScore {
  id: string;
  user_id: string;
  bodyweight_kg: number;
  squat_1rm_kg: number;
  deadlift_1rm_kg: number;
  bench_1rm_kg: number;
  ohp_1rm_kg: number;
  weighted_dip_1rm_kg: number;
  weighted_pullup_1rm_kg: number;
  power_rating: number;
  recorded_at: string;
}

export interface BossBattle {
  id: string;
  title: string;
  description: string;
  difficulty: BossDifficulty;
  start_date: string;
  end_date: string;
  challenge_type: ChallengeType;
  target_value: number;
  exercise_name?: string;
  xp_base_reward: number;
  xp_multiplier: number;
  achievement_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface UserBossProgress {
  id: string;
  user_id: string;
  boss_id: string;
  boss?: BossBattle;
  current_progress: number;
  is_completed: boolean;
  completed_at?: string;
  xp_earned: number;
  created_at: string;
  updated_at: string;
}

export interface Reward {
  id: string;
  code: string;
  name: string;
  description: string;
  reward_type: RewardType;
  unlock_requirement_type: 'level' | 'achievement' | 'power_rating' | 'xp';
  unlock_requirement_value?: number;
  achievement_id?: string;
  preview_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface UserReward {
  id: string;
  user_id: string;
  reward_id: string;
  reward?: Reward;
  is_equipped: boolean;
  unlocked_at: string;
}

export interface WorkoutStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_workout_date?: string;
  streak_milestones: number[];
  created_at: string;
  updated_at: string;
}

export interface AwardXpResult {
  new_total_xp: number;
  new_level: number;
  leveled_up: boolean;
  previous_level: number;
}

export interface UpdateStreakResult {
  current_streak: number;
  longest_streak: number;
  milestone_reached: number;
  milestone_xp: number;
}

export interface LevelInfo {
  level: number;
  xp_to_next: number;
  title: LevelTier;
  percentage_to_next: number;
}

// XP Rewards Configuration
export const XP_REWARDS: Record<XpType, number> = {
  set_complete: 10,
  workout_complete: 100,
  pr_broken: 250,
  streak_milestone: 50, // Variable, base amount
  perfect_form: 25,
  boss_battle: 500, // Variable, base amount
  achievement: 100, // Variable, based on achievement tier
};

// Priority lifts get 2x XP
export const PRIORITY_LIFTS = [
  'Squat',
  'Deadlift',
  'Bench Press',
  'Overhead Press',
  'Weighted Dip',
  'Weighted Pull-up',
];

// Level thresholds
export const LEVEL_THRESHOLDS = {
  NOVICE: { min: 1, max: 10, xpMin: 0, xpMax: 2000 },
  INTERMEDIATE: { min: 11, max: 25, xpMin: 2000, xpMax: 10000 },
  ADVANCED: { min: 26, max: 40, xpMin: 10000, xpMax: 30000 },
  ELITE: { min: 41, max: 60, xpMin: 30000, xpMax: 100000 },
  LEGENDARY: { min: 61, max: 999, xpMin: 100000, xpMax: Infinity },
};

// Achievement tier XP rewards
export const ACHIEVEMENT_TIER_XP: Record<AchievementTier, number> = {
  bronze: 100,
  silver: 250,
  gold: 500,
  platinum: 1000,
  legendary: 2500,
};

// Boss difficulty multipliers
export const BOSS_DIFFICULTY_MULTIPLIERS: Record<BossDifficulty, number> = {
  normal: 1.0,
  hard: 1.5,
  nightmare: 2.5,
};
