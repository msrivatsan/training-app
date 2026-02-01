// Gamification Service - Database operations for XP, levels, achievements, etc.

import { createClient } from '@/lib/supabase/client';
import {
  Achievement,
  UserAchievementProgress,
  UserLevel,
  XpTransaction,
  WorkoutStreak,
  StrengthScore,
  BossBattle,
  UserBossProgress,
  Reward,
  UserReward,
  AwardXpResult,
  UpdateStreakResult,
  XpType,
} from './types';
import { calculateLevel } from './xp-utils';

const supabase = createClient();

/**
 * Get user's current level and XP
 */
export async function getUserLevel(
  userId: string
): Promise<UserLevel | null> {
  const { data, error } = await supabase
    .from('user_levels')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user level:', {
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return null;
  }

  // Initialize if doesn't exist
  if (!data) {
    const { data: newLevel, error: insertError } = await supabase
      .from('user_levels')
      .insert({
        user_id: userId,
        total_xp: 0,
        current_level: 1,
        xp_to_next_level: 200,
        title: 'Novice Lifter',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating user level:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
      });
      return null;
    }

    return newLevel;
  }

  return data;
}

/**
 * Award XP to user (calls database function)
 */
export async function awardXp(
  userId: string,
  xpAmount: number,
  xpType: XpType,
  description?: string,
  sessionId?: string,
  metadata?: Record<string, any>
): Promise<AwardXpResult | null> {
  const { data, error } = await supabase.rpc('award_xp', {
    p_user_id: userId,
    p_xp_amount: xpAmount,
    p_xp_type: xpType,
    p_description: description || null,
    p_session_id: sessionId || null,
    p_metadata: metadata || null,
  });

  if (error) {
    console.error('Error awarding XP:', error);
    return null;
  }

  return data[0] || null;
}

/**
 * Get recent XP transactions
 */
export async function getRecentXpTransactions(
  userId: string,
  limit: number = 20
): Promise<XpTransaction[]> {
  const { data, error } = await supabase
    .from('xp_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching XP transactions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all achievements
 */
export async function getAllAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('category', { ascending: true })
    .order('tier', { ascending: true });

  if (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's achievement progress
 */
export async function getUserAchievementProgress(
  userId: string
): Promise<UserAchievementProgress[]> {
  const { data, error } = await supabase
    .from('user_achievement_progress')
    .select('*, achievement:achievements(*)')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching achievement progress:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's unlocked achievements
 */
export async function getUnlockedAchievements(
  userId: string
): Promise<UserAchievementProgress[]> {
  const { data, error } = await supabase
    .from('user_achievement_progress')
    .select('*, achievement:achievements(*)')
    .eq('user_id', userId)
    .eq('is_unlocked', true)
    .order('unlocked_at', { ascending: false });

  if (error) {
    console.error('Error fetching unlocked achievements:', error);
    return [];
  }

  return data || [];
}

/**
 * Update achievement progress
 */
export async function updateAchievementProgress(
  userId: string,
  achievementId: string,
  progress: number,
  unlocked: boolean = false
): Promise<UserAchievementProgress | null> {
  // Check if progress already exists
  const { data: existing } = await supabase
    .from('user_achievement_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
    .single();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('user_achievement_progress')
      .update({
        current_progress: progress,
        is_unlocked: unlocked,
        unlocked_at: unlocked ? new Date().toISOString() : existing.unlocked_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating achievement progress:', error);
      return null;
    }

    return data;
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('user_achievement_progress')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
        current_progress: progress,
        is_unlocked: unlocked,
        unlocked_at: unlocked ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating achievement progress:', error);
      return null;
    }

    return data;
  }
}

/**
 * Get user's workout streak
 */
export async function getWorkoutStreak(
  userId: string
): Promise<WorkoutStreak | null> {
  const { data, error } = await supabase
    .from('workout_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching workout streak:', {
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return null;
  }

  if (!data) {
    // Initialize
    const { data: newStreak, error: insertError } = await supabase
      .from('workout_streaks')
      .insert({
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        streak_milestones: [],
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating workout streak:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
      });
      return null;
    }

    return newStreak;
  }

  return data;
}

/**
 * Update workout streak (calls database function)
 */
export async function updateWorkoutStreak(
  userId: string
): Promise<UpdateStreakResult | null> {
  const { data, error } = await supabase.rpc('update_workout_streak', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error updating workout streak:', error);
    return null;
  }

  return data[0] || null;
}

/**
 * Get user's latest strength score
 */
export async function getLatestStrengthScore(
  userId: string
): Promise<StrengthScore | null> {
  const { data, error } = await supabase
    .from('strength_scores')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching strength score:', {
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return null;
  }

  return data || null;
}

/**
 * Get strength score history
 */
export async function getStrengthScoreHistory(
  userId: string,
  limit: number = 30
): Promise<StrengthScore[]> {
  const { data, error } = await supabase
    .from('strength_scores')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching strength score history:', error);
    return [];
  }

  return data || [];
}

/**
 * Record new strength score
 */
export async function recordStrengthScore(
  userId: string,
  bodyweight: number,
  lifts: {
    squat?: number;
    deadlift?: number;
    bench?: number;
    ohp?: number;
    weightedDip?: number;
    weightedPullup?: number;
  }
): Promise<StrengthScore | null> {
  const { data, error } = await supabase
    .from('strength_scores')
    .insert({
      user_id: userId,
      bodyweight_kg: bodyweight,
      squat_1rm_kg: lifts.squat || 0,
      deadlift_1rm_kg: lifts.deadlift || 0,
      bench_1rm_kg: lifts.bench || 0,
      ohp_1rm_kg: lifts.ohp || 0,
      weighted_dip_1rm_kg: lifts.weightedDip || 0,
      weighted_pullup_1rm_kg: lifts.weightedPullup || 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error recording strength score:', error);
    return null;
  }

  return data;
}

/**
 * Get active boss battles
 */
export async function getActiveBossBattles(): Promise<BossBattle[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('boss_battles')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', today)
    .gte('end_date', today);

  if (error) {
    console.error('Error fetching active boss battles:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's boss battle progress
 */
export async function getUserBossProgress(
  userId: string
): Promise<UserBossProgress[]> {
  const { data, error } = await supabase
    .from('user_boss_progress')
    .select('*, boss:boss_battles(*)')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching boss progress:', error);
    return [];
  }

  return data || [];
}

/**
 * Update boss battle progress
 */
export async function updateBossProgress(
  userId: string,
  bossId: string,
  progress: number,
  completed: boolean = false,
  xpEarned: number = 0
): Promise<UserBossProgress | null> {
  // Check if progress exists
  const { data: existing } = await supabase
    .from('user_boss_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('boss_id', bossId)
    .single();

  if (existing) {
    // Update
    const { data, error } = await supabase
      .from('user_boss_progress')
      .update({
        current_progress: progress,
        is_completed: completed,
        completed_at: completed
          ? new Date().toISOString()
          : existing.completed_at,
        xp_earned: xpEarned,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating boss progress:', error);
      return null;
    }

    return data;
  } else {
    // Insert
    const { data, error } = await supabase
      .from('user_boss_progress')
      .insert({
        user_id: userId,
        boss_id: bossId,
        current_progress: progress,
        is_completed: completed,
        completed_at: completed ? new Date().toISOString() : null,
        xp_earned: xpEarned,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating boss progress:', error);
      return null;
    }

    return data;
  }
}

/**
 * Get all rewards
 */
export async function getAllRewards(): Promise<Reward[]> {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .order('unlock_requirement_value', { ascending: true });

  if (error) {
    console.error('Error fetching rewards:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's unlocked rewards
 */
export async function getUserRewards(userId: string): Promise<UserReward[]> {
  const { data, error } = await supabase
    .from('user_rewards')
    .select('*, reward:rewards(*)')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user rewards:', error);
    return [];
  }

  return data || [];
}

/**
 * Unlock reward for user
 */
export async function unlockReward(
  userId: string,
  rewardId: string
): Promise<UserReward | null> {
  // Check if already unlocked
  const { data: existing } = await supabase
    .from('user_rewards')
    .select('*')
    .eq('user_id', userId)
    .eq('reward_id', rewardId)
    .single();

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from('user_rewards')
    .insert({
      user_id: userId,
      reward_id: rewardId,
      is_equipped: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error unlocking reward:', error);
    return null;
  }

  return data;
}

/**
 * Equip/unequip reward (for themes)
 */
export async function toggleRewardEquipped(
  userId: string,
  rewardId: string,
  equipped: boolean
): Promise<boolean> {
  const { error } = await supabase
    .from('user_rewards')
    .update({ is_equipped: equipped })
    .eq('user_id', userId)
    .eq('reward_id', rewardId);

  if (error) {
    console.error('Error toggling reward equipped:', error);
    return false;
  }

  return true;
}
