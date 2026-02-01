-- ============================================================================
-- Iron Quest - Supabase Database Schema
-- ============================================================================
-- This schema creates all necessary tables, indexes, and security policies
-- for the Iron Quest workout tracking application.
--
-- Execute this in your Supabase SQL Editor to set up the database.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Extends Supabase auth.users with additional profile information

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  height_cm DECIMAL(5, 2),
  weight_kg DECIMAL(5, 2),
  fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  goals TEXT[], -- Array of fitness goals
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create updated_at trigger for users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PROGRAMS TABLE
-- ============================================================================
-- Workout programs/training plans

CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) NOT NULL DEFAULT 'beginner',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_programs_user_id ON public.programs(user_id);
CREATE INDEX idx_programs_is_active ON public.programs(is_active);

CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- WORKOUTS TABLE
-- ============================================================================
-- Individual workouts within a program

CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_workouts_program_id ON public.workouts(program_id);
CREATE INDEX idx_workouts_order_index ON public.workouts(order_index);

CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- EXERCISE_LIBRARY TABLE
-- ============================================================================
-- Master library of all available exercises (global, not user-specific)

CREATE TABLE IF NOT EXISTS public.exercise_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  primary_muscle_group TEXT NOT NULL,
  secondary_muscle_groups TEXT[] DEFAULT '{}',
  equipment_needed TEXT[] DEFAULT '{}',
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) NOT NULL DEFAULT 'intermediate',
  video_url TEXT,
  is_compound BOOLEAN DEFAULT FALSE,
  is_priority BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_exercise_library_primary_muscle ON public.exercise_library(primary_muscle_group);
CREATE INDEX idx_exercise_library_secondary_muscles ON public.exercise_library USING GIN(secondary_muscle_groups);
CREATE INDEX idx_exercise_library_equipment ON public.exercise_library USING GIN(equipment_needed);
CREATE INDEX idx_exercise_library_difficulty ON public.exercise_library(difficulty_level);
CREATE INDEX idx_exercise_library_is_priority ON public.exercise_library(is_priority);

CREATE TRIGGER update_exercise_library_updated_at
  BEFORE UPDATE ON public.exercise_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- EXERCISES TABLE
-- ============================================================================
-- Exercises within a workout (user-specific instances)

CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_library_id UUID REFERENCES public.exercise_library(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  muscle_groups TEXT[] NOT NULL DEFAULT '{}', -- e.g., ['chest', 'triceps']
  equipment TEXT[] NOT NULL DEFAULT '{}', -- e.g., ['barbell', 'bench']
  video_url TEXT,
  image_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  target_sets INTEGER,
  target_reps INTEGER,
  target_weight_kg DECIMAL(6, 2),
  rest_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_exercises_workout_id ON public.exercises(workout_id);
CREATE INDEX idx_exercises_exercise_library_id ON public.exercises(exercise_library_id);
CREATE INDEX idx_exercises_order_index ON public.exercises(order_index);
CREATE INDEX idx_exercises_muscle_groups ON public.exercises USING GIN(muscle_groups);

CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- WORKOUT_SESSIONS TABLE
-- ============================================================================
-- Instances of completed or in-progress workouts

CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  total_volume_kg DECIMAL(10, 2),
  notes TEXT,
  status TEXT CHECK (status IN ('in_progress', 'completed', 'cancelled')) DEFAULT 'in_progress',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_workout_id ON public.workout_sessions(workout_id);
CREATE INDEX idx_workout_sessions_status ON public.workout_sessions(status);
CREATE INDEX idx_workout_sessions_started_at ON public.workout_sessions(started_at DESC);

CREATE TRIGGER update_workout_sessions_updated_at
  BEFORE UPDATE ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SETS TABLE
-- ============================================================================
-- Individual sets performed during a workout session

CREATE TABLE IF NOT EXISTS public.sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_kg DECIMAL(6, 2) NOT NULL,
  rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10), -- Rate of Perceived Exertion
  rest_seconds INTEGER,
  notes TEXT,
  is_warmup BOOLEAN DEFAULT FALSE,
  is_drop_set BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_sets_session_id ON public.sets(session_id);
CREATE INDEX idx_sets_exercise_id ON public.sets(exercise_id);
CREATE INDEX idx_sets_created_at ON public.sets(created_at DESC);

CREATE TRIGGER update_sets_updated_at
  BEFORE UPDATE ON public.sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- USER_ACHIEVEMENTS TABLE
-- ============================================================================
-- User achievements and milestones

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  category TEXT CHECK (category IN ('strength', 'endurance', 'consistency', 'milestone')) NOT NULL,
  date_earned TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_category ON public.user_achievements(category);
CREATE INDEX idx_user_achievements_date_earned ON public.user_achievements(date_earned DESC);

-- ============================================================================
-- BODY_MEASUREMENTS TABLE
-- ============================================================================
-- Track body measurements over time

CREATE TABLE IF NOT EXISTS public.body_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg DECIMAL(5, 2),
  body_fat_percentage DECIMAL(4, 2),
  muscle_mass_kg DECIMAL(5, 2),
  chest_cm DECIMAL(5, 2),
  waist_cm DECIMAL(5, 2),
  hips_cm DECIMAL(5, 2),
  bicep_left_cm DECIMAL(4, 2),
  bicep_right_cm DECIMAL(4, 2),
  thigh_left_cm DECIMAL(4, 2),
  thigh_right_cm DECIMAL(4, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, date) -- One measurement per day per user
);

CREATE INDEX idx_body_measurements_user_id ON public.body_measurements(user_id);
CREATE INDEX idx_body_measurements_date ON public.body_measurements(date DESC);

CREATE TRIGGER update_body_measurements_updated_at
  BEFORE UPDATE ON public.body_measurements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on all tables and create security policies

-- Users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Programs table
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own programs"
  ON public.programs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own programs"
  ON public.programs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own programs"
  ON public.programs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own programs"
  ON public.programs FOR DELETE
  USING (auth.uid() = user_id);

-- Workouts table
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workouts from their programs"
  ON public.workouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.programs
      WHERE programs.id = workouts.program_id
      AND programs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create workouts in their programs"
  ON public.workouts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.programs
      WHERE programs.id = workouts.program_id
      AND programs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update workouts in their programs"
  ON public.workouts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.programs
      WHERE programs.id = workouts.program_id
      AND programs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete workouts from their programs"
  ON public.workouts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.programs
      WHERE programs.id = workouts.program_id
      AND programs.user_id = auth.uid()
    )
  );

-- Exercise Library table
ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercise library"
  ON public.exercise_library FOR SELECT
  USING (true);

-- Exercises table
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view exercises from their workouts"
  ON public.exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts
      JOIN public.programs ON programs.id = workouts.program_id
      WHERE workouts.id = exercises.workout_id
      AND programs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create exercises in their workouts"
  ON public.exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workouts
      JOIN public.programs ON programs.id = workouts.program_id
      WHERE workouts.id = exercises.workout_id
      AND programs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exercises in their workouts"
  ON public.exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts
      JOIN public.programs ON programs.id = workouts.program_id
      WHERE workouts.id = exercises.workout_id
      AND programs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exercises from their workouts"
  ON public.exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts
      JOIN public.programs ON programs.id = workouts.program_id
      WHERE workouts.id = exercises.workout_id
      AND programs.user_id = auth.uid()
    )
  );

-- Workout Sessions table
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workout sessions"
  ON public.workout_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout sessions"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout sessions"
  ON public.workout_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout sessions"
  ON public.workout_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Sets table
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sets from their sessions"
  ON public.sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE workout_sessions.id = sets.session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sets in their sessions"
  ON public.sets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE workout_sessions.id = sets.session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sets in their sessions"
  ON public.sets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE workout_sessions.id = sets.session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sets from their sessions"
  ON public.sets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions
      WHERE workout_sessions.id = sets.session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );

-- User Achievements table
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Body Measurements table
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own body measurements"
  ON public.body_measurements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own body measurements"
  ON public.body_measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own body measurements"
  ON public.body_measurements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own body measurements"
  ON public.body_measurements FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate total volume for a workout session
CREATE OR REPLACE FUNCTION public.calculate_session_volume(session_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_volume DECIMAL;
BEGIN
  SELECT COALESCE(SUM(reps * weight_kg), 0)
  INTO total_volume
  FROM public.sets
  WHERE sets.session_id = calculate_session_volume.session_id
  AND is_warmup = FALSE;

  RETURN total_volume;
END;
$$ LANGUAGE plpgsql;

-- Function to update session volume and duration on set changes
CREATE OR REPLACE FUNCTION public.update_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.workout_sessions
  SET
    total_volume_kg = public.calculate_session_volume(NEW.session_id),
    updated_at = NOW()
  WHERE id = NEW.session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session stats when sets are added/updated
CREATE TRIGGER update_session_stats_on_set_change
  AFTER INSERT OR UPDATE ON public.sets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_session_stats();

-- ============================================================================
-- HELPFUL VIEWS
-- ============================================================================

-- View for workout sessions with details
CREATE OR REPLACE VIEW workout_sessions_with_details AS
SELECT
  ws.id,
  ws.user_id,
  ws.workout_id,
  ws.program_id,
  ws.started_at,
  ws.completed_at,
  ws.duration_minutes,
  ws.total_volume_kg,
  ws.notes,
  ws.status,
  w.name as workout_name,
  p.name as program_name,
  COUNT(DISTINCT s.exercise_id) as exercises_count,
  COUNT(s.id) as total_sets
FROM public.workout_sessions ws
LEFT JOIN public.workouts w ON w.id = ws.workout_id
LEFT JOIN public.programs p ON p.id = ws.program_id
LEFT JOIN public.sets s ON s.session_id = ws.id
GROUP BY ws.id, w.name, p.name;

-- ============================================================================
-- EXERCISE LIBRARY SEED DATA
-- ============================================================================
-- Comprehensive exercise library with 80+ exercises

-- Priority Compound Lifts (from 6-Day Strength Program)
INSERT INTO public.exercise_library (name, description, primary_muscle_group, secondary_muscle_groups, equipment_needed, difficulty_level, is_compound, is_priority, video_url) VALUES
  ('Barbell Bench Press', 'Classic compound chest exercise, lie on bench and press barbell from chest to full extension', 'chest', ARRAY['triceps', 'shoulders'], ARRAY['barbell', 'bench'], 'intermediate', true, false, 'https://youtube.com/watch?v=rT7DgCr-3pg'),
  ('Overhead Press (OHP)', 'Standing or seated barbell shoulder press, press from shoulders to overhead', 'shoulders', ARRAY['triceps', 'core'], ARRAY['barbell'], 'intermediate', true, false, 'https://youtube.com/watch?v=2yjwXTZQDDI'),
  ('Weighted Dips', 'Compound pressing movement on parallel bars with added weight', 'chest', ARRAY['triceps', 'shoulders'], ARRAY['dip bars', 'weight belt'], 'intermediate', true, true, 'https://youtube.com/watch?v=2z8JmcrW-As'),
  ('Weighted Pull-ups', 'Pull your body up to bar with added weight until chin clears the bar', 'back', ARRAY['biceps', 'forearms'], ARRAY['pull-up bar', 'weight belt'], 'intermediate', true, true, 'https://youtube.com/watch?v=eGo4IYlbE5g'),
  ('Barbell Squat', 'King of leg exercises, squat with barbell on back until thighs parallel to ground', 'quads', ARRAY['glutes', 'hamstrings', 'core'], ARRAY['barbell', 'squat rack'], 'intermediate', true, true, 'https://youtube.com/watch?v=ultWZbUMPL8'),
  ('Conventional Deadlift', 'Lift barbell from ground to standing position, hip-width stance', 'back', ARRAY['glutes', 'hamstrings', 'traps'], ARRAY['barbell'], 'advanced', true, true, 'https://youtube.com/watch?v=op9kVnSso6Q'),
  ('Romanian Deadlift', 'Hip-hinge movement emphasizing hamstrings and glutes', 'hamstrings', ARRAY['glutes', 'lower back'], ARRAY['barbell'], 'intermediate', true, false, 'https://youtube.com/watch?v=2SHsk9AzdjA');

-- Push Day Exercises
INSERT INTO public.exercise_library (name, description, primary_muscle_group, secondary_muscle_groups, equipment_needed, difficulty_level, is_compound, is_priority, video_url) VALUES
  ('Incline Dumbbell Press', 'Dumbbell press on incline bench, targets upper chest', 'chest', ARRAY['shoulders', 'triceps'], ARRAY['dumbbells', 'bench'], 'intermediate', true, false, 'https://youtube.com/watch?v=8iPEnn-ltC8'),
  ('Lateral Raise', 'Isolation exercise for side deltoids, raise dumbbells to shoulder height', 'shoulders', ARRAY[], ARRAY['dumbbells'], 'beginner', false, false, 'https://youtube.com/watch?v=3VcKaXpzqRo'),
  ('Tricep Extension', 'Overhead or lying tricep extension with cable or dumbbell', 'triceps', ARRAY[], ARRAY['cable', 'dumbbell'], 'beginner', false, false, 'https://youtube.com/watch?v=2-LAMcpzODU'),
  ('Cable Flyes', 'Cable chest fly for chest isolation and stretch', 'chest', ARRAY['shoulders'], ARRAY['cable'], 'intermediate', false, false, 'https://youtube.com/watch?v=Iwe6AmxVf7o'),
  ('Dumbbell Shoulder Press', 'Seated or standing dumbbell press for shoulders', 'shoulders', ARRAY['triceps'], ARRAY['dumbbells', 'bench'], 'beginner', true, false, 'https://youtube.com/watch?v=qEwKCR5JCog'),
  ('Chest Dips', 'Bodyweight dips with forward lean to emphasize chest', 'chest', ARRAY['triceps', 'shoulders'], ARRAY['dip bars'], 'intermediate', true, false, 'https://youtube.com/watch?v=2z8JmcrW-As'),
  ('Close-Grip Bench Press', 'Bench press with narrow grip emphasizing triceps', 'triceps', ARRAY['chest', 'shoulders'], ARRAY['barbell', 'bench'], 'intermediate', true, false, 'https://youtube.com/watch?v=nEF0bv2FW94'),
  ('Cable Crossover', 'High to low cable crossover for lower chest development', 'chest', ARRAY['shoulders'], ARRAY['cable'], 'intermediate', false, false, 'https://youtube.com/watch?v=taI4XduLpTk'),
  ('Front Raise', 'Dumbbell or barbell front raise for front deltoids', 'shoulders', ARRAY[], ARRAY['dumbbells', 'barbell'], 'beginner', false, false, 'https://youtube.com/watch?v=SDx5gSRhO2Y'),
  ('Skull Crushers', 'Lying tricep extension, lower bar to forehead and extend', 'triceps', ARRAY[], ARRAY['barbell', 'bench'], 'intermediate', false, false, 'https://youtube.com/watch?v=d_KZxkY_0cM'),
  ('Incline Barbell Bench Press', 'Barbell bench press on incline for upper chest', 'chest', ARRAY['shoulders', 'triceps'], ARRAY['barbell', 'bench'], 'intermediate', true, false, 'https://youtube.com/watch?v=SrqOu55lrYU'),
  ('Arnold Press', 'Rotating dumbbell shoulder press, invented by Arnold Schwarzenegger', 'shoulders', ARRAY['triceps'], ARRAY['dumbbells'], 'intermediate', true, false, 'https://youtube.com/watch?v=6Z15_WdXmVw'),
  ('Decline Bench Press', 'Bench press on decline bench for lower chest emphasis', 'chest', ARRAY['triceps', 'shoulders'], ARRAY['barbell', 'bench'], 'intermediate', true, false, 'https://youtube.com/watch?v=LfyQBUKR8SE');

-- Pull Day Exercises
INSERT INTO public.exercise_library (name, description, primary_muscle_group, secondary_muscle_groups, equipment_needed, difficulty_level, is_compound, is_priority, video_url) VALUES
  ('Chest-Supported Dumbbell Row', 'Row dumbbells while chest supported on incline bench', 'back', ARRAY['biceps', 'traps'], ARRAY['dumbbells', 'bench'], 'intermediate', true, false, 'https://youtube.com/watch?v=RNSD1oXendI'),
  ('Lat Pulldown', 'Pull cable bar down to upper chest, targets lats', 'back', ARRAY['biceps', 'traps'], ARRAY['cable'], 'beginner', true, false, 'https://youtube.com/watch?v=CAwf7n6Luuc'),
  ('Face Pulls', 'Cable pull to face with rope attachment, great for rear delts and posture', 'shoulders', ARRAY['traps', 'upper back'], ARRAY['cable'], 'beginner', false, false, 'https://youtube.com/watch?v=rep-qVOkqgk'),
  ('Incline Dumbbell Curl', 'Bicep curl on incline bench for long head emphasis', 'biceps', ARRAY[], ARRAY['dumbbells', 'bench'], 'beginner', false, false, 'https://youtube.com/watch?v=soxrZlIl35U'),
  ('Barbell Row', 'Bent-over row with barbell, fundamental back builder', 'back', ARRAY['biceps', 'traps', 'lower back'], ARRAY['barbell'], 'intermediate', true, false, 'https://youtube.com/watch?v=kBWAon7ItDw'),
  ('Dumbbell Row', 'Single-arm or bent-over dumbbell row', 'back', ARRAY['biceps', 'traps'], ARRAY['dumbbells'], 'beginner', true, false, 'https://youtube.com/watch?v=roCP6wCXPqo'),
  ('Single-Arm Dumbbell Row', 'One-arm dumbbell row with knee on bench for support', 'back', ARRAY['biceps', 'traps'], ARRAY['dumbbells', 'bench'], 'beginner', true, false, 'https://youtube.com/watch?v=roCP6wCXPqo'),
  ('Rear Delt Fly', 'Isolation exercise for rear deltoids using dumbbells or cable', 'shoulders', ARRAY['upper back'], ARRAY['dumbbells', 'cable'], 'beginner', false, false, 'https://youtube.com/watch?v=EA7u4Q_8kc0'),
  ('Cable Curl', 'Bicep curl using cable for constant tension', 'biceps', ARRAY[], ARRAY['cable'], 'beginner', false, false, 'https://youtube.com/watch?v=fczR2nGBFUQ'),
  ('Hammer Curl', 'Neutral grip dumbbell curl targeting brachialis and forearms', 'biceps', ARRAY['forearms'], ARRAY['dumbbells'], 'beginner', false, false, 'https://youtube.com/watch?v=zC3nLlEvin4'),
  ('T-Bar Row', 'Landmine or machine row for thick back development', 'back', ARRAY['biceps', 'traps'], ARRAY['barbell', 't-bar'], 'intermediate', true, false, 'https://youtube.com/watch?v=j3Igk5nyZE4'),
  ('Seated Cable Row', 'Cable row from seated position', 'back', ARRAY['biceps', 'traps'], ARRAY['cable'], 'beginner', true, false, 'https://youtube.com/watch?v=GZbfZ033f74'),
  ('Preacher Curl', 'Bicep curl on preacher bench for strict form', 'biceps', ARRAY[], ARRAY['dumbbells', 'barbell', 'bench'], 'beginner', false, false, 'https://youtube.com/watch?v=fIWP-FRFNU0'),
  ('Barbell Curl', 'Standing barbell curl for biceps', 'biceps', ARRAY[], ARRAY['barbell'], 'beginner', false, false, 'https://youtube.com/watch?v=LY1V6UbRHFM'),
  ('Chin-ups', 'Pull-ups with underhand grip emphasizing biceps', 'back', ARRAY['biceps'], ARRAY['pull-up bar'], 'intermediate', true, false, 'https://youtube.com/watch?v=brhRXlOhkAM'),
  ('Shrugs', 'Trap-focused movement, shrug shoulders with heavy weight', 'traps', ARRAY[], ARRAY['dumbbells', 'barbell'], 'beginner', false, false, 'https://youtube.com/watch?v=cJRVVxmytaM');

-- Leg Day Exercises
INSERT INTO public.exercise_library (name, description, primary_muscle_group, secondary_muscle_groups, equipment_needed, difficulty_level, is_compound, is_priority, video_url) VALUES
  ('Pause Squats', 'Squat with 2-3 second pause at bottom for increased difficulty', 'quads', ARRAY['glutes', 'hamstrings'], ARRAY['barbell', 'squat rack'], 'advanced', true, false, 'https://youtube.com/watch?v=PLHY2-nt-y4'),
  ('Bulgarian Split Squat', 'Single-leg squat with rear foot elevated', 'quads', ARRAY['glutes', 'hamstrings'], ARRAY['dumbbells', 'bench'], 'intermediate', true, false, 'https://youtube.com/watch?v=2C-uNgKwPLE'),
  ('Leg Extension', 'Isolation exercise for quadriceps using machine', 'quads', ARRAY[], ARRAY['machine'], 'beginner', false, false, 'https://youtube.com/watch?v=YyvSfVjQeL0'),
  ('Hamstring Curl', 'Lying or seated leg curl machine for hamstrings', 'hamstrings', ARRAY[], ARRAY['machine'], 'beginner', false, false, 'https://youtube.com/watch?v=ELOCsoDSmrg'),
  ('Calf Raise', 'Standing or seated calf raise for calf development', 'calves', ARRAY[], ARRAY['machine', 'dumbbells'], 'beginner', false, false, 'https://youtube.com/watch?v=gwLzBJYoWlI'),
  ('Front Squat', 'Squat with barbell on front of shoulders, quad-dominant', 'quads', ARRAY['core', 'glutes'], ARRAY['barbell', 'squat rack'], 'advanced', true, false, 'https://youtube.com/watch?v=uYumuL_G_V0'),
  ('Leg Press', 'Machine-based leg press for overall leg development', 'quads', ARRAY['glutes', 'hamstrings'], ARRAY['machine'], 'beginner', true, false, 'https://youtube.com/watch?v=IZxyjW7MPJQ'),
  ('Walking Lunges', 'Dynamic lunge variation walking forward', 'quads', ARRAY['glutes', 'hamstrings'], ARRAY['dumbbells'], 'intermediate', true, false, 'https://youtube.com/watch?v=L8fvypPrzzs'),
  ('Goblet Squat', 'Squat holding dumbbell or kettlebell at chest', 'quads', ARRAY['glutes', 'core'], ARRAY['dumbbell', 'kettlebell'], 'beginner', true, false, 'https://youtube.com/watch?v=MeHQ4O4GmKI'),
  ('Hack Squat', 'Machine squat with back support', 'quads', ARRAY['glutes'], ARRAY['machine'], 'intermediate', true, false, 'https://youtube.com/watch?v=0tn5K9NlCfo'),
  ('Sumo Deadlift', 'Wide-stance deadlift emphasizing inner thighs and glutes', 'glutes', ARRAY['quads', 'hamstrings', 'back'], ARRAY['barbell'], 'intermediate', true, false, 'https://youtube.com/watch?v=wQk5wJBGYI4'),
  ('Good Morning', 'Hip hinge exercise for hamstrings and lower back', 'hamstrings', ARRAY['lower back', 'glutes'], ARRAY['barbell'], 'intermediate', false, false, 'https://youtube.com/watch?v=YA-h3n2sbQI'),
  ('Hip Thrust', 'Glute-focused exercise, thrust hips upward with barbell', 'glutes', ARRAY['hamstrings'], ARRAY['barbell', 'bench'], 'intermediate', false, false, 'https://youtube.com/watch?v=xDmFkJxPzeM'),
  ('Step-ups', 'Step up onto elevated platform with weight', 'quads', ARRAY['glutes'], ARRAY['dumbbells', 'box'], 'beginner', true, false, 'https://youtube.com/watch?v=dQqApCGd5Ss');

-- Core/Abs Exercises
INSERT INTO public.exercise_library (name, description, primary_muscle_group, secondary_muscle_groups, equipment_needed, difficulty_level, is_compound, is_priority, video_url) VALUES
  ('Hanging Leg Raises', 'Raise legs while hanging from bar for lower abs', 'abs', ARRAY['hip flexors'], ARRAY['pull-up bar'], 'intermediate', false, false, 'https://youtube.com/watch?v=Pr1ieGZ5atk'),
  ('Cable Crunches', 'Kneeling cable crunch for abs', 'abs', ARRAY[], ARRAY['cable'], 'beginner', false, false, 'https://youtube.com/watch?v=Ffpzrd0l_ls'),
  ('Planks', 'Isometric hold in push-up position for core stability', 'abs', ARRAY['core'], ARRAY['bodyweight'], 'beginner', false, false, 'https://youtube.com/watch?v=ASdvN_XEl_c'),
  ('Dead Bugs', 'Lying core exercise, alternate arm and leg extensions', 'abs', ARRAY['core'], ARRAY['bodyweight'], 'beginner', false, false, 'https://youtube.com/watch?v=4XLEnwUr1d8'),
  ('Ab Wheel Rollout', 'Roll ab wheel forward for intense core workout', 'abs', ARRAY['core', 'shoulders'], ARRAY['ab wheel'], 'advanced', false, false, 'https://youtube.com/watch?v=EXm0HcJlxIg'),
  ('Russian Twist', 'Seated rotation exercise with weight for obliques', 'abs', ARRAY['obliques'], ARRAY['medicine ball', 'dumbbell'], 'beginner', false, false, 'https://youtube.com/watch?v=wkD8rjkodUI'),
  ('Bicycle Crunches', 'Dynamic crunch with alternating elbow to knee', 'abs', ARRAY['obliques'], ARRAY['bodyweight'], 'beginner', false, false, 'https://youtube.com/watch?v=Iwyvozckjak'),
  ('Mountain Climbers', 'Dynamic plank variation bringing knees to chest', 'abs', ARRAY['core', 'cardio'], ARRAY['bodyweight'], 'beginner', false, false, 'https://youtube.com/watch?v=nmwgirgXLYM'),
  ('Side Plank', 'Lateral plank for oblique strength', 'abs', ARRAY['obliques', 'core'], ARRAY['bodyweight'], 'beginner', false, false, 'https://youtube.com/watch?v=K2VljzCC16g'),
  ('Leg Raises', 'Raise legs while lying flat for lower abs', 'abs', ARRAY[], ARRAY['bodyweight'], 'beginner', false, false, 'https://youtube.com/watch?v=JB2oyawG9KI'),
  ('Dragon Flag', 'Advanced core exercise, lower body with straight legs', 'abs', ARRAY['core'], ARRAY['bench'], 'advanced', false, false, 'https://youtube.com/watch?v=njKXkuhY7_0');

-- Additional Compound & Functional Exercises
INSERT INTO public.exercise_library (name, description, primary_muscle_group, secondary_muscle_groups, equipment_needed, difficulty_level, is_compound, is_priority, video_url) VALUES
  ('Clean and Press', 'Olympic lift: clean barbell to shoulders then press overhead', 'shoulders', ARRAY['quads', 'back', 'triceps'], ARRAY['barbell'], 'advanced', true, false, 'https://youtube.com/watch?v=KwYJTpQ_x5A'),
  ('Thrusters', 'Front squat immediately into overhead press', 'quads', ARRAY['shoulders', 'core'], ARRAY['barbell', 'dumbbells'], 'intermediate', true, false, 'https://youtube.com/watch?v=L219ltL15zk'),
  ('Burpees', 'Full body cardio exercise: squat, plank, jump', 'cardio', ARRAY['full body'], ARRAY['bodyweight'], 'beginner', true, false, 'https://youtube.com/watch?v=JZQA08SlJnM'),
  ('Box Jumps', 'Explosive jump onto elevated platform', 'quads', ARRAY['glutes', 'calves'], ARRAY['box'], 'intermediate', false, false, 'https://youtube.com/watch?v=NBY9-kTuHEk'),
  ('Farmers Walk', 'Walk with heavy weights in each hand for grip and core', 'forearms', ARRAY['traps', 'core'], ARRAY['dumbbells', 'kettlebells'], 'beginner', false, false, 'https://youtube.com/watch?v=rt17lmnaLSM'),
  ('Kettlebell Swing', 'Hip hinge swing with kettlebell for power and conditioning', 'glutes', ARRAY['hamstrings', 'core'], ARRAY['kettlebell'], 'intermediate', true, false, 'https://youtube.com/watch?v=YSxHifyI6s8'),
  ('Turkish Get-Up', 'Complex movement from lying to standing with weight overhead', 'core', ARRAY['shoulders', 'full body'], ARRAY['kettlebell', 'dumbbell'], 'advanced', true, false, 'https://youtube.com/watch?v=0bWRPC49-KI'),
  ('Battle Ropes', 'Wave heavy ropes for cardio and upper body conditioning', 'cardio', ARRAY['shoulders', 'core'], ARRAY['battle ropes'], 'intermediate', false, false, 'https://youtube.com/watch?v=u0JO6hRzQ20'),
  ('Sled Push', 'Push weighted sled for leg power and conditioning', 'quads', ARRAY['glutes', 'cardio'], ARRAY['sled'], 'intermediate', true, false, 'https://youtube.com/watch?v=cS0MKIqbW4Y'),
  ('Medicine Ball Slam', 'Explosive overhead slam of medicine ball', 'abs', ARRAY['shoulders', 'cardio'], ARRAY['medicine ball'], 'beginner', false, false, 'https://youtube.com/watch?v=EXm0HcJlxIg');

-- Mobility & Accessory
INSERT INTO public.exercise_library (name, description, primary_muscle_group, secondary_muscle_groups, equipment_needed, difficulty_level, is_compound, is_priority, video_url) VALUES
  ('Wall Angels', 'Shoulder mobility exercise against wall', 'shoulders', ARRAY['upper back'], ARRAY['wall'], 'beginner', false, false, 'https://youtube.com/watch?v=2XZ0VeRsusI'),
  ('Band Pull-Aparts', 'Pull resistance band apart for rear delt and upper back', 'shoulders', ARRAY['upper back'], ARRAY['resistance band'], 'beginner', false, false, 'https://youtube.com/watch?v=JbyjNymZP1Q'),
  ('Pallof Press', 'Anti-rotation core exercise with cable or band', 'abs', ARRAY['core', 'obliques'], ARRAY['cable', 'resistance band'], 'intermediate', false, false, 'https://youtube.com/watch?v=AH_C4M8kyLw'),
  ('Bird Dog', 'Quadruped exercise extending opposite arm and leg', 'core', ARRAY['lower back', 'glutes'], ARRAY['bodyweight'], 'beginner', false, false, 'https://youtube.com/watch?v=wiFNA3sqjCA');

-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================================================
-- User preferences for notification settings

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,

  -- Enable/disable each notification type
  workout_reminder_enabled BOOLEAN DEFAULT TRUE,
  rest_day_reminder_enabled BOOLEAN DEFAULT TRUE,
  deload_week_alert_enabled BOOLEAN DEFAULT TRUE,
  streak_milestone_enabled BOOLEAN DEFAULT TRUE,
  achievement_unlocked_enabled BOOLEAN DEFAULT TRUE,
  friend_activity_enabled BOOLEAN DEFAULT FALSE,
  weekly_summary_enabled BOOLEAN DEFAULT TRUE,

  -- Delivery methods
  push_notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications_enabled BOOLEAN DEFAULT FALSE,
  sms_notifications_enabled BOOLEAN DEFAULT FALSE,

  -- Quiet hours (24-hour format, e.g., 22 = 10pm, 7 = 7am)
  quiet_hours_start INTEGER CHECK (quiet_hours_start >= 0 AND quiet_hours_start <= 23) DEFAULT 22,
  quiet_hours_end INTEGER CHECK (quiet_hours_end >= 0 AND quiet_hours_end <= 23) DEFAULT 7,

  -- Reminder timing (minutes before scheduled workout)
  reminder_minutes_before INTEGER DEFAULT 30,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
-- Store all notifications sent to users

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Notification type
  type TEXT NOT NULL CHECK (type IN (
    'workout_reminder',
    'rest_day_reminder',
    'deload_week_alert',
    'streak_milestone',
    'achievement_unlocked',
    'friend_activity',
    'weekly_summary',
    'friend_request',
    'friend_accepted',
    'post_like',
    'post_comment',
    'partner_request',
    'workout_invite',
    'challenge_complete'
  )),

  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- Deep link to relevant page

  -- Metadata
  metadata JSONB, -- Additional data specific to notification type

  -- Status
  read BOOLEAN DEFAULT FALSE,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  delivery_method TEXT CHECK (delivery_method IN ('push', 'email', 'sms', 'in_app')),

  -- Scheduling
  scheduled_for TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_sent ON public.notifications(sent);
CREATE INDEX idx_notifications_scheduled_for ON public.notifications(scheduled_for);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- USER ACTIVITY PATTERNS TABLE
-- ============================================================================
-- Learn and store user's typical workout patterns for smart timing

CREATE TABLE IF NOT EXISTS public.user_activity_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Day of week (0 = Sunday, 6 = Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),

  -- Typical workout time (24-hour format, stored as hour)
  typical_hour INTEGER CHECK (typical_hour >= 0 AND typical_hour <= 23),

  -- Frequency (how often they work out on this day/time)
  frequency_count INTEGER DEFAULT 1,

  -- Last workout at this time
  last_workout_at TIMESTAMPTZ,

  -- Confidence score (0-100, higher = more consistent)
  confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, day_of_week)
);

CREATE INDEX idx_user_activity_patterns_user_id ON public.user_activity_patterns(user_id);
CREATE INDEX idx_user_activity_patterns_day_of_week ON public.user_activity_patterns(day_of_week);
CREATE INDEX idx_user_activity_patterns_confidence ON public.user_activity_patterns(confidence_score DESC);

CREATE TRIGGER update_user_activity_patterns_updated_at
  BEFORE UPDATE ON public.user_activity_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- NOTIFICATION RLS POLICIES
-- ============================================================================

-- Notification Preferences table
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- User Activity Patterns table
ALTER TABLE public.user_activity_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity patterns"
  ON public.user_activity_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activity patterns"
  ON public.user_activity_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity patterns"
  ON public.user_activity_patterns FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- NOTIFICATION FUNCTIONS
-- ============================================================================

-- Function to automatically create default notification preferences for new users
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notification preferences when user is created
CREATE OR REPLACE TRIGGER on_user_created_notification_prefs
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_notification_preferences();

-- Function to update user activity patterns when workout is completed
CREATE OR REPLACE FUNCTION public.update_activity_pattern()
RETURNS TRIGGER AS $$
DECLARE
  workout_day INTEGER;
  workout_hour INTEGER;
  existing_count INTEGER;
BEGIN
  -- Only process when workout is completed
  IF NEW.status = 'completed' AND NEW.completed_at IS NOT NULL THEN
    -- Extract day of week and hour
    workout_day := EXTRACT(DOW FROM NEW.completed_at);
    workout_hour := EXTRACT(HOUR FROM NEW.completed_at);

    -- Update or insert activity pattern
    INSERT INTO public.user_activity_patterns (
      user_id,
      day_of_week,
      typical_hour,
      frequency_count,
      last_workout_at,
      confidence_score
    )
    VALUES (
      NEW.user_id,
      workout_day,
      workout_hour,
      1,
      NEW.completed_at,
      20 -- Starting confidence
    )
    ON CONFLICT (user_id, day_of_week)
    DO UPDATE SET
      typical_hour = workout_hour,
      frequency_count = user_activity_patterns.frequency_count + 1,
      last_workout_at = NEW.completed_at,
      confidence_score = LEAST(100, user_activity_patterns.confidence_score + 10),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update activity patterns on workout completion
CREATE TRIGGER update_activity_pattern_on_workout_complete
  AFTER UPDATE ON public.workout_sessions
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.update_activity_pattern();

-- Function to check if current time is within quiet hours
CREATE OR REPLACE FUNCTION public.is_in_quiet_hours(
  p_user_id UUID,
  p_check_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS BOOLEAN AS $$
DECLARE
  v_quiet_start INTEGER;
  v_quiet_end INTEGER;
  v_current_hour INTEGER;
BEGIN
  -- Get user's quiet hours settings
  SELECT quiet_hours_start, quiet_hours_end
  INTO v_quiet_start, v_quiet_end
  FROM public.notification_preferences
  WHERE user_id = p_user_id;

  -- If no preferences found, default to not in quiet hours
  IF v_quiet_start IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get current hour in user's timezone (simplified - uses server time)
  v_current_hour := EXTRACT(HOUR FROM p_check_time);

  -- Check if current hour is in quiet hours range
  -- Handle wrap-around (e.g., 22:00 to 07:00)
  IF v_quiet_start <= v_quiet_end THEN
    RETURN v_current_hour >= v_quiet_start AND v_current_hour < v_quiet_end;
  ELSE
    RETURN v_current_hour >= v_quiet_start OR v_current_hour < v_quiet_end;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================
-- Uncomment to insert sample data

-- INSERT INTO public.programs (user_id, name, description, difficulty_level)
-- VALUES
--   (auth.uid(), 'Push Pull Legs', '6-day PPL split for hypertrophy', 'intermediate'),
--   (auth.uid(), 'Full Body 3x', 'Full body workout 3 times per week', 'beginner');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
