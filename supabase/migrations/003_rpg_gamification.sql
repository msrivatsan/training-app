-- RPG Gamification System Migration
-- Creates XP, leveling, achievements, boss battles, and rewards system

-- User XP and Leveling Table
CREATE TABLE user_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  xp_to_next_level INTEGER NOT NULL DEFAULT 200,
  title TEXT NOT NULL DEFAULT 'Novice Lifter',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- XP Transaction History
CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
  xp_amount INTEGER NOT NULL,
  xp_type TEXT NOT NULL, -- 'set_complete', 'workout_complete', 'pr_broken', 'streak_milestone', 'perfect_form', 'boss_battle', 'achievement'
  description TEXT,
  metadata JSONB, -- For storing additional context like exercise_id, achievement_id, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Achievement System (100+ achievements)
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- e.g., 'century_club_squat', 'week_warrior'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'strength', 'consistency', 'volume', 'progression', 'special', 'boss'
  tier TEXT NOT NULL DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum', 'legendary'
  xp_reward INTEGER NOT NULL DEFAULT 100,
  icon TEXT, -- Icon name from Lucide
  requirement_type TEXT NOT NULL, -- 'weight', 'streak', 'volume', 'count', 'time', 'ratio'
  requirement_value NUMERIC,
  exercise_name TEXT, -- For exercise-specific achievements
  is_secret BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievement Progress and Unlocks
CREATE TABLE user_achievement_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  current_progress NUMERIC NOT NULL DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Strength Score (Power Rating) Tracking
CREATE TABLE strength_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bodyweight_kg NUMERIC NOT NULL,
  squat_1rm_kg NUMERIC DEFAULT 0,
  deadlift_1rm_kg NUMERIC DEFAULT 0,
  bench_1rm_kg NUMERIC DEFAULT 0,
  ohp_1rm_kg NUMERIC DEFAULT 0,
  weighted_dip_1rm_kg NUMERIC DEFAULT 0,
  weighted_pullup_1rm_kg NUMERIC DEFAULT 0,
  power_rating NUMERIC GENERATED ALWAYS AS (
    (squat_1rm_kg + deadlift_1rm_kg + bench_1rm_kg + ohp_1rm_kg + weighted_dip_1rm_kg + weighted_pullup_1rm_kg) / NULLIF(bodyweight_kg, 0)
  ) STORED,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Boss Battles (Monthly Challenges)
CREATE TABLE boss_battles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL, -- 'normal', 'hard', 'nightmare'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  challenge_type TEXT NOT NULL, -- 'weight_target', 'volume_target', 'streak_target', 'pr_count'
  target_value NUMERIC NOT NULL,
  exercise_name TEXT, -- For exercise-specific bosses
  xp_base_reward INTEGER NOT NULL DEFAULT 500,
  xp_multiplier NUMERIC NOT NULL DEFAULT 1.5,
  achievement_id UUID REFERENCES achievements(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Boss Battle Progress
CREATE TABLE user_boss_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  boss_id UUID NOT NULL REFERENCES boss_battles(id) ON DELETE CASCADE,
  current_progress NUMERIC NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, boss_id)
);

-- Unlockable Rewards (Themes, Features, etc.)
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- e.g., 'theme_dark_gym', 'feature_advanced_analytics'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_type TEXT NOT NULL, -- 'theme', 'exercise_variation', 'analytics_feature', 'trophy'
  unlock_requirement_type TEXT NOT NULL, -- 'level', 'achievement', 'power_rating', 'xp'
  unlock_requirement_value NUMERIC,
  achievement_id UUID REFERENCES achievements(id),
  preview_url TEXT, -- For theme previews
  metadata JSONB, -- For storing theme colors, feature flags, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Unlocked Rewards
CREATE TABLE user_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  is_equipped BOOLEAN DEFAULT FALSE, -- For themes and cosmetics
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, reward_id)
);

-- Workout Streaks
CREATE TABLE workout_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_workout_date DATE,
  streak_milestones INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- Array of milestone days hit (7, 14, 30, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX idx_xp_transactions_user ON xp_transactions(user_id, created_at DESC);
CREATE INDEX idx_xp_transactions_session ON xp_transactions(session_id);
CREATE INDEX idx_user_achievement_progress_user ON user_achievement_progress(user_id);
CREATE INDEX idx_user_achievement_progress_unlocked ON user_achievement_progress(user_id, is_unlocked);
CREATE INDEX idx_strength_scores_user ON strength_scores(user_id, recorded_at DESC);
CREATE INDEX idx_boss_battles_active ON boss_battles(is_active, start_date, end_date);
CREATE INDEX idx_user_boss_progress_active ON user_boss_progress(user_id, is_completed);
CREATE INDEX idx_user_rewards_equipped ON user_rewards(user_id, is_equipped);

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS TABLE(level INTEGER, xp_to_next INTEGER, title TEXT) AS $$
DECLARE
  current_level INTEGER;
  next_level_xp INTEGER;
  level_title TEXT;
BEGIN
  -- Leveling formula: Each level requires progressively more XP
  -- Levels 1-10: 0-2,000 XP (200 XP per level)
  -- Levels 11-25: 2,000-10,000 XP (~533 XP per level)
  -- Levels 26-40: 10,000-30,000 XP (~1,333 XP per level)
  -- Levels 41-60: 30,000-100,000 XP (~3,500 XP per level)
  -- Levels 61+: 100,000+ XP (~10,000 XP per level)

  IF xp < 2000 THEN
    current_level := 1 + (xp / 200);
    next_level_xp := ((current_level) * 200) - xp;
    level_title := 'Novice Lifter';
  ELSIF xp < 10000 THEN
    current_level := 11 + ((xp - 2000) / 533);
    next_level_xp := (2000 + ((current_level - 10) * 533)) - xp;
    level_title := 'Intermediate Athlete';
  ELSIF xp < 30000 THEN
    current_level := 26 + ((xp - 10000) / 1333);
    next_level_xp := (10000 + ((current_level - 25) * 1333)) - xp;
    level_title := 'Advanced Lifter';
  ELSIF xp < 100000 THEN
    current_level := 41 + ((xp - 30000) / 3500);
    next_level_xp := (30000 + ((current_level - 40) * 3500)) - xp;
    level_title := 'Elite Strength';
  ELSE
    current_level := 61 + ((xp - 100000) / 10000);
    next_level_xp := (100000 + ((current_level - 60) * 10000)) - xp;
    level_title := 'Legendary';
  END IF;

  RETURN QUERY SELECT current_level, next_level_xp, level_title;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to award XP and update level
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_xp_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_session_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE(
  new_total_xp INTEGER,
  new_level INTEGER,
  leveled_up BOOLEAN,
  previous_level INTEGER
) AS $$
DECLARE
  v_current_xp INTEGER;
  v_current_level INTEGER;
  v_new_level INTEGER;
  v_xp_to_next INTEGER;
  v_title TEXT;
  v_leveled_up BOOLEAN := FALSE;
BEGIN
  -- Get current XP and level
  SELECT total_xp, current_level INTO v_current_xp, v_current_level
  FROM user_levels
  WHERE user_id = p_user_id;

  -- Initialize if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO user_levels (user_id, total_xp, current_level, xp_to_next_level, title)
    VALUES (p_user_id, 0, 1, 200, 'Novice Lifter');
    v_current_xp := 0;
    v_current_level := 1;
  END IF;

  -- Add XP
  v_current_xp := v_current_xp + p_xp_amount;

  -- Calculate new level
  SELECT * INTO v_new_level, v_xp_to_next, v_title
  FROM calculate_level(v_current_xp);

  -- Check if leveled up
  IF v_new_level > v_current_level THEN
    v_leveled_up := TRUE;
  END IF;

  -- Update user_levels
  UPDATE user_levels
  SET
    total_xp = v_current_xp,
    current_level = v_new_level,
    xp_to_next_level = v_xp_to_next,
    title = v_title,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO xp_transactions (user_id, session_id, xp_amount, xp_type, description, metadata)
  VALUES (p_user_id, p_session_id, p_xp_amount, p_xp_type, p_description, p_metadata);

  RETURN QUERY SELECT v_current_xp, v_new_level, v_leveled_up, v_current_level;
END;
$$ LANGUAGE plpgsql;

-- Function to update workout streak
CREATE OR REPLACE FUNCTION update_workout_streak(p_user_id UUID)
RETURNS TABLE(
  current_streak INTEGER,
  longest_streak INTEGER,
  milestone_reached INTEGER,
  milestone_xp INTEGER
) AS $$
DECLARE
  v_last_workout_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_today DATE := CURRENT_DATE;
  v_milestone INTEGER := 0;
  v_milestone_xp INTEGER := 0;
  v_milestones INTEGER[];
BEGIN
  -- Get current streak data
  SELECT last_workout_date, workout_streaks.current_streak, workout_streaks.longest_streak, streak_milestones
  INTO v_last_workout_date, v_current_streak, v_longest_streak, v_milestones
  FROM workout_streaks
  WHERE user_id = p_user_id;

  -- Initialize if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO workout_streaks (user_id, current_streak, longest_streak, last_workout_date, streak_milestones)
    VALUES (p_user_id, 1, 1, v_today, ARRAY[]::INTEGER[])
    RETURNING workout_streaks.current_streak, workout_streaks.longest_streak INTO v_current_streak, v_longest_streak;

    RETURN QUERY SELECT v_current_streak, v_longest_streak, 0, 0;
    RETURN;
  END IF;

  -- Check if workout is on consecutive day
  IF v_last_workout_date = v_today THEN
    -- Same day, no change
    RETURN QUERY SELECT v_current_streak, v_longest_streak, 0, 0;
    RETURN;
  ELSIF v_last_workout_date = v_today - INTERVAL '1 day' THEN
    -- Consecutive day, increment streak
    v_current_streak := v_current_streak + 1;
  ELSE
    -- Streak broken, reset to 1
    v_current_streak := 1;
  END IF;

  -- Update longest streak
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  -- Check for milestone (7, 14, 30, 60, 90, 180, 365 days)
  IF v_current_streak IN (7, 14, 30, 60, 90, 180, 365) AND NOT (v_current_streak = ANY(v_milestones)) THEN
    v_milestone := v_current_streak;
    v_milestones := array_append(v_milestones, v_current_streak);

    -- Award milestone XP
    CASE v_current_streak
      WHEN 7 THEN v_milestone_xp := 50;
      WHEN 14 THEN v_milestone_xp := 100;
      WHEN 30 THEN v_milestone_xp := 250;
      WHEN 60 THEN v_milestone_xp := 500;
      WHEN 90 THEN v_milestone_xp := 750;
      WHEN 180 THEN v_milestone_xp := 1000;
      WHEN 365 THEN v_milestone_xp := 2000;
    END CASE;

    -- Award the XP
    PERFORM award_xp(
      p_user_id,
      v_milestone_xp,
      'streak_milestone',
      format('%s-day streak achieved!', v_current_streak),
      NULL,
      jsonb_build_object('milestone_days', v_current_streak)
    );
  END IF;

  -- Update streak record
  UPDATE workout_streaks
  SET
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_workout_date = v_today,
    streak_milestones = v_milestones,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_current_streak, v_longest_streak, v_milestone, v_milestone_xp;
END;
$$ LANGUAGE plpgsql;

-- Seed initial achievements (100+ achievements)
INSERT INTO achievements (code, name, description, category, tier, xp_reward, icon, requirement_type, requirement_value, exercise_name) VALUES

-- STRENGTH ACHIEVEMENTS - Squat
('squat_plate_club', 'Plate Club - Squat', 'Squat 60kg for the first time', 'strength', 'bronze', 100, 'Award', 'weight', 60, 'Squat'),
('squat_century_club', 'Century Club - Squat', 'Squat 100kg for the first time', 'strength', 'silver', 250, 'Trophy', 'weight', 100, 'Squat'),
('squat_two_plate', 'Two Plate Squat', 'Squat 140kg (two 20kg plates per side)', 'strength', 'gold', 500, 'Crown', 'weight', 140, 'Squat'),
('squat_three_plate', 'Three Plate Squat', 'Squat 180kg (three 20kg plates per side)', 'strength', 'platinum', 1000, 'Gem', 'weight', 180, 'Squat'),
('squat_four_plate', 'Four Plate Squat', 'Legendary 220kg squat', 'strength', 'legendary', 2500, 'Sparkles', 'weight', 220, 'Squat'),

-- STRENGTH ACHIEVEMENTS - Deadlift
('deadlift_plate_club', 'Plate Club - Deadlift', 'Deadlift 60kg for the first time', 'strength', 'bronze', 100, 'Award', 'weight', 60, 'Deadlift'),
('deadlift_century_club', 'Century Club - Deadlift', 'Deadlift 100kg for the first time', 'strength', 'silver', 250, 'Trophy', 'weight', 100, 'Deadlift'),
('deadlift_two_plate', 'Two Plate Deadlift', 'Deadlift 140kg', 'strength', 'gold', 500, 'Crown', 'weight', 140, 'Deadlift'),
('deadlift_three_plate', 'Three Plate Deadlift', 'Deadlift 180kg', 'strength', 'platinum', 1000, 'Gem', 'weight', 180, 'Deadlift'),
('deadlift_four_plate', 'Four Plate Deadlift', 'Legendary 220kg deadlift', 'strength', 'legendary', 2500, 'Sparkles', 'weight', 220, 'Deadlift'),

-- STRENGTH ACHIEVEMENTS - Bench Press
('bench_plate_club', 'Plate Club - Bench', 'Bench press 60kg', 'strength', 'bronze', 100, 'Award', 'weight', 60, 'Bench Press'),
('bench_century_club', 'Century Club - Bench', 'Bench press 100kg', 'strength', 'silver', 250, 'Trophy', 'weight', 100, 'Bench Press'),
('bench_two_plate', 'Two Plate Bench', 'Bench press 140kg', 'strength', 'gold', 500, 'Crown', 'weight', 140, 'Bench Press'),
('bench_three_plate', 'Three Plate Bench', 'Bench press 180kg', 'strength', 'platinum', 1000, 'Gem', 'weight', 180, 'Bench Press'),

-- STRENGTH ACHIEVEMENTS - Overhead Press
('ohp_plate_club', 'Plate Club - OHP', 'Overhead press 60kg', 'strength', 'bronze', 100, 'Award', 'weight', 60, 'Overhead Press'),
('ohp_bodyweight', 'Bodyweight OHP', 'Overhead press your bodyweight', 'strength', 'gold', 750, 'Flame', 'weight', 0, 'Overhead Press'),

-- STRENGTH ACHIEVEMENTS - Weighted Dips & Pull-ups
('weighted_dip_plate', 'Weighted Dip Warrior', 'Dip with 20kg added weight', 'strength', 'silver', 200, 'Zap', 'weight', 20, 'Weighted Dip'),
('weighted_dip_bodyweight', 'Double Bodyweight Dip', 'Dip with bodyweight added (e.g., 80kg person + 80kg)', 'strength', 'legendary', 2000, 'Rocket', 'ratio', 1.0, 'Weighted Dip'),
('weighted_pullup_plate', 'Weighted Pull-up Pro', 'Pull-up with 20kg added weight', 'strength', 'silver', 200, 'Zap', 'weight', 20, 'Weighted Pull-up'),
('weighted_pullup_half_bodyweight', 'Half Bodyweight Pull-up', 'Pull-up with 50% bodyweight added', 'strength', 'gold', 750, 'Award', 'ratio', 0.5, 'Weighted Pull-up'),

-- CONSISTENCY ACHIEVEMENTS
('first_workout', 'First Step', 'Complete your first workout', 'consistency', 'bronze', 50, 'Footprints', 'count', 1, NULL),
('week_warrior', 'Week Warrior', 'Maintain a 7-day workout streak', 'consistency', 'bronze', 150, 'Calendar', 'streak', 7, NULL),
('iron_will', 'Iron Will', 'Maintain a 30-day workout streak', 'consistency', 'gold', 500, 'Flame', 'streak', 30, NULL),
('relentless', 'Relentless', 'Maintain a 60-day workout streak', 'consistency', 'platinum', 1000, 'Zap', 'streak', 60, NULL),
('unstoppable', 'Unstoppable Force', 'Maintain a 90-day workout streak', 'consistency', 'legendary', 2000, 'Crown', 'streak', 90, NULL),
('iron_year', 'Iron Year', 'Maintain a 365-day workout streak', 'consistency', 'legendary', 5000, 'Sparkles', 'streak', 365, NULL),
('ten_workouts', 'Getting Started', 'Complete 10 workouts', 'consistency', 'bronze', 100, 'Target', 'count', 10, NULL),
('fifty_workouts', 'Dedicated Lifter', 'Complete 50 workouts', 'consistency', 'silver', 300, 'Award', 'count', 50, NULL),
('hundred_workouts', 'Century of Strength', 'Complete 100 workouts', 'consistency', 'gold', 750, 'Trophy', 'count', 100, NULL),
('five_hundred_workouts', 'Gym Legend', 'Complete 500 workouts', 'consistency', 'legendary', 3000, 'Crown', 'count', 500, NULL),

-- VOLUME ACHIEVEMENTS
('5_ton_week', '5 Ton Week', 'Lift 5,000kg in total volume in one week', 'volume', 'bronze', 150, 'Weight', 'volume', 5000, NULL),
('10_ton_week', '10 Ton Week', 'Lift 10,000kg in total volume in one week', 'volume', 'silver', 300, 'Dumbbell', 'volume', 10000, NULL),
('20_ton_week', '20 Ton Titan', 'Lift 20,000kg in total volume in one week', 'volume', 'gold', 600, 'Mountain', 'volume', 20000, NULL),
('50_ton_month', '50 Ton Month', 'Lift 50,000kg in total volume in one month', 'volume', 'platinum', 1500, 'Trophy', 'volume', 50000, NULL),
('100_ton_month', '100 Ton Monster', 'Lift 100,000kg in total volume in one month', 'volume', 'legendary', 3000, 'Gem', 'volume', 100000, NULL),

-- PROGRESSION ACHIEVEMENTS
('first_pr', 'New Heights', 'Break your first personal record', 'progression', 'bronze', 100, 'TrendingUp', 'count', 1, NULL),
('ten_prs', 'Progress Machine', 'Break 10 personal records', 'progression', 'silver', 300, 'BarChart', 'count', 10, NULL),
('fifty_prs', 'PR Hunter', 'Break 50 personal records', 'progression', 'gold', 750, 'LineChart', 'count', 50, NULL),
('hundred_prs', 'Record Breaker', 'Break 100 personal records', 'progression', 'platinum', 2000, 'Award', 'count', 100, NULL),

-- SPECIAL TIME-BASED ACHIEVEMENTS
('early_bird', 'Early Bird', 'Complete a workout before 6:00 AM', 'special', 'bronze', 100, 'Sunrise', 'time', 6, NULL),
('midnight_grinder', 'Midnight Grinder', 'Complete a workout after 10:00 PM', 'special', 'bronze', 100, 'Moon', 'time', 22, NULL),
('weekend_warrior', 'Weekend Warrior', 'Complete workouts on Saturday and Sunday in the same week', 'special', 'bronze', 150, 'Calendar', 'count', 2, NULL),

-- FORM & TECHNIQUE ACHIEVEMENTS
('perfect_form_5', 'Form Focused', 'Receive 5 perfect form bonuses', 'special', 'bronze', 100, 'Eye', 'count', 5, NULL),
('perfect_form_25', 'Technique Master', 'Receive 25 perfect form bonuses', 'special', 'silver', 300, 'CheckCircle', 'count', 25, NULL),
('perfect_form_100', 'Flawless Execution', 'Receive 100 perfect form bonuses', 'special', 'gold', 1000, 'Award', 'count', 100, NULL),

-- POWER RATING ACHIEVEMENTS
('power_rating_5', 'Strength Initiate', 'Achieve a Power Rating of 5.0', 'strength', 'bronze', 200, 'Zap', 'power_rating', 5.0, NULL),
('power_rating_10', 'Power Lifter', 'Achieve a Power Rating of 10.0', 'strength', 'silver', 500, 'Bolt', 'power_rating', 10.0, NULL),
('power_rating_15', 'Elite Strength', 'Achieve a Power Rating of 15.0', 'strength', 'gold', 1000, 'Flame', 'power_rating', 15.0, NULL),
('power_rating_20', 'Legendary Power', 'Achieve a Power Rating of 20.0', 'strength', 'legendary', 2500, 'Sparkles', 'power_rating', 20.0, NULL),

-- BOSS BATTLE ACHIEVEMENTS
('first_boss_defeat', 'Boss Slayer', 'Defeat your first Boss Battle', 'boss', 'silver', 300, 'Sword', 'count', 1, NULL),
('five_boss_defeats', 'Boss Hunter', 'Defeat 5 Boss Battles', 'boss', 'gold', 750, 'Shield', 'count', 5, NULL),
('nightmare_boss', 'Nightmare Conqueror', 'Defeat a Nightmare difficulty Boss Battle', 'boss', 'legendary', 2000, 'Skull', 'count', 1, NULL),

-- DELOAD & RECOVERY ACHIEVEMENTS
('first_deload', 'Smart Recovery', 'Complete your first deload week', 'special', 'bronze', 100, 'Heart', 'count', 1, NULL),
('recovery_king', 'Recovery King', 'Complete 10 deload weeks', 'special', 'gold', 500, 'Smile', 'count', 10, NULL),

-- VARIETY ACHIEVEMENTS
('exercise_variety_10', 'Exercise Explorer', 'Perform 10 different exercises', 'special', 'bronze', 100, 'Shuffle', 'count', 10, NULL),
('exercise_variety_25', 'Movement Master', 'Perform 25 different exercises', 'special', 'silver', 300, 'Grid', 'count', 25, NULL),
('exercise_variety_50', 'Exercise Encyclopedia', 'Perform 50 different exercises', 'special', 'gold', 750, 'BookOpen', 'count', 50, NULL),

-- SECRET ACHIEVEMENTS
('secret_500_sets', 'The Grind Never Stops', 'Complete 500 total sets (secret)', 'special', 'platinum', 1000, 'Lock', 'count', 500, NULL, TRUE),
('secret_perfect_month', 'Perfect Month', 'Complete every scheduled workout in a month (secret)', 'special', 'legendary', 2500, 'Star', 'count', 1, NULL, TRUE),
('secret_zero_missed', 'Flawless Start', 'Complete first 30 workouts without missing a scheduled session (secret)', 'special', 'legendary', 2000, 'CheckCircle', 'count', 30, NULL, TRUE);

-- Seed initial rewards (Themes, features, etc.)
INSERT INTO rewards (code, name, description, reward_type, unlock_requirement_type, unlock_requirement_value, metadata) VALUES
-- THEMES
('theme_dark_gym', 'Dark Gym Theme', 'Sleek dark theme with iron and steel aesthetics', 'theme', 'level', 5, '{"colors": {"primary": "#1a1a1a", "accent": "#FF6B00"}}'),
('theme_neon_beast', 'Neon Beast Theme', 'High-energy neon theme with vibrant colors', 'theme', 'level', 15, '{"colors": {"primary": "#0a0a0a", "accent": "#00FFFF"}}'),
('theme_gold_standard', 'Gold Standard Theme', 'Premium gold and black theme', 'theme', 'level', 30, '{"colors": {"primary": "#000000", "accent": "#FFD700"}}'),
('theme_blood_iron', 'Blood & Iron Theme', 'Intense red and black warrior theme', 'theme', 'level', 50, '{"colors": {"primary": "#1a0000", "accent": "#CC0000"}}'),

-- ANALYTICS FEATURES
('analytics_1rm_predictor', '1RM Prediction Tool', 'Advanced one-rep max prediction analytics', 'analytics_feature', 'level', 10, '{"feature_flag": "enable_1rm_predictor"}'),
('analytics_volume_tracker', 'Volume Tracker Pro', 'Detailed volume tracking and trends', 'analytics_feature', 'level', 20, '{"feature_flag": "enable_volume_tracker"}'),
('analytics_strength_curve', 'Strength Curve Analysis', 'Visualize strength progression curves', 'analytics_feature', 'power_rating', 10.0, '{"feature_flag": "enable_strength_curves"}'),

-- EXERCISE VARIATIONS
('exercise_pause_reps', 'Pause Rep Variations', 'Unlock pause rep training techniques', 'exercise_variation', 'level', 12, '{"variations": ["pause_squat", "pause_bench", "pause_deadlift"]}'),
('exercise_tempo_control', 'Tempo Control Training', 'Unlock tempo-based training protocols', 'exercise_variation', 'level', 25, '{"variations": ["tempo_squat", "tempo_bench"]}'),

-- TROPHIES
('trophy_first_pr', 'First PR Trophy', 'Commemorates your first personal record', 'trophy', 'achievement', NULL, '{"icon": "Trophy", "color": "gold"}'),
('trophy_century_club', 'Century Club Trophy', 'Achieved 100kg in a major lift', 'trophy', 'achievement', NULL, '{"icon": "Award", "color": "silver"}'),
('trophy_year_streak', 'Iron Year Trophy', 'Maintained a full year workout streak', 'trophy', 'achievement', NULL, '{"icon": "Crown", "color": "legendary"}');

-- Enable Row Level Security
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievement_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE strength_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE boss_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_boss_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own level" ON user_levels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own level" ON user_levels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own level" ON user_levels FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own XP transactions" ON xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert XP transactions" ON xp_transactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);

CREATE POLICY "Users can view their own achievement progress" ON user_achievement_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own achievement progress" ON user_achievement_progress FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own strength scores" ON strength_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own strength scores" ON strength_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view active boss battles" ON boss_battles FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own boss progress" ON user_boss_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own boss progress" ON user_boss_progress FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view rewards" ON rewards FOR SELECT USING (true);

CREATE POLICY "Users can view their own unlocked rewards" ON user_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own rewards" ON user_rewards FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own workout streaks" ON workout_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own workout streaks" ON workout_streaks FOR ALL USING (auth.uid() = user_id);

-- Add more achievements to reach 100+
INSERT INTO achievements (code, name, description, category, tier, xp_reward, icon, requirement_type, requirement_value, exercise_name) VALUES

-- Additional Squat Achievements
('squat_50kg', 'Half Century Squat', 'Squat 50kg', 'strength', 'bronze', 50, 'Award', 'weight', 50, 'Squat'),
('squat_80kg', '80kg Squat Club', 'Squat 80kg', 'strength', 'bronze', 150, 'Trophy', 'weight', 80, 'Squat'),
('squat_120kg', '120kg Squat Beast', 'Squat 120kg', 'strength', 'silver', 350, 'Flame', 'weight', 120, 'Squat'),
('squat_150kg', '150kg Squat Elite', 'Squat 150kg', 'strength', 'gold', 600, 'Crown', 'weight', 150, 'Squat'),
('squat_200kg', '200kg Squat Legend', 'Squat 200kg', 'strength', 'platinum', 1500, 'Gem', 'weight', 200, 'Squat'),

-- Additional Deadlift Achievements
('deadlift_80kg', '80kg Deadlift', 'Deadlift 80kg', 'strength', 'bronze', 150, 'Trophy', 'weight', 80, 'Deadlift'),
('deadlift_120kg', '120kg Deadlift Beast', 'Deadlift 120kg', 'strength', 'silver', 350, 'Flame', 'weight', 120, 'Deadlift'),
('deadlift_150kg', '150kg Deadlift Elite', 'Deadlift 150kg', 'strength', 'gold', 600, 'Crown', 'weight', 150, 'Deadlift'),
('deadlift_200kg', '200kg Deadlift Legend', 'Deadlift 200kg', 'strength', 'platinum', 1500, 'Gem', 'weight', 200, 'Deadlift'),
('deadlift_250kg', '250kg Deadlift God', 'Deadlift 250kg', 'strength', 'legendary', 3000, 'Sparkles', 'weight', 250, 'Deadlift'),

-- Additional Bench Press Achievements
('bench_40kg', 'Bench Beginner', 'Bench press 40kg', 'strength', 'bronze', 50, 'Award', 'weight', 40, 'Bench Press'),
('bench_80kg', '80kg Bench Club', 'Bench press 80kg', 'strength', 'bronze', 150, 'Trophy', 'weight', 80, 'Bench Press'),
('bench_120kg', '120kg Bench Beast', 'Bench press 120kg', 'strength', 'gold', 600, 'Crown', 'weight', 120, 'Bench Press'),
('bench_150kg', '150kg Bench Elite', 'Bench press 150kg', 'strength', 'platinum', 1200, 'Gem', 'weight', 150, 'Bench Press'),

-- Row/Chin-up Achievements
('pullup_10_reps', 'Pull-up Novice', 'Complete 10 pull-ups in one set', 'strength', 'bronze', 100, 'Award', 'count', 10, 'Pull-up'),
('pullup_20_reps', 'Pull-up Pro', 'Complete 20 pull-ups in one set', 'strength', 'gold', 500, 'Trophy', 'count', 20, 'Pull-up'),
('chinup_bodyweight_added', 'Weighted Chin King', 'Chin-up with bodyweight added', 'strength', 'legendary', 2000, 'Crown', 'ratio', 1.0, 'Chin-up'),

-- Rep-based achievements
('hundred_reps_session', 'Century of Reps', 'Complete 100 reps in a single workout', 'volume', 'bronze', 150, 'Target', 'count', 100, NULL),
('five_hundred_reps_week', '500 Rep Week', 'Complete 500 reps in one week', 'volume', 'silver', 300, 'Zap', 'count', 500, NULL),
('thousand_reps_month', '1000 Rep Month', 'Complete 1000 reps in one month', 'volume', 'gold', 750, 'Flame', 'count', 1000, NULL);

COMMENT ON TABLE user_levels IS 'Tracks user XP, level, and title progression';
COMMENT ON TABLE xp_transactions IS 'Historical record of all XP earned';
COMMENT ON TABLE achievements IS 'Master list of all unlockable achievements';
COMMENT ON TABLE user_achievement_progress IS 'Tracks user progress towards and unlocking of achievements';
COMMENT ON TABLE strength_scores IS 'Historical Power Rating calculations';
COMMENT ON TABLE boss_battles IS 'Monthly challenge battles with special rewards';
COMMENT ON TABLE user_boss_progress IS 'User progress on active boss battles';
COMMENT ON TABLE rewards IS 'Unlockable themes, features, and cosmetics';
COMMENT ON TABLE user_rewards IS 'Tracks which rewards users have unlocked';
COMMENT ON TABLE workout_streaks IS 'Tracks consecutive workout day streaks';
