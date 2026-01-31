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
-- EXERCISES TABLE
-- ============================================================================
-- Exercises within a workout

CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
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
