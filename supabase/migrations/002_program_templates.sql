-- ============================================================================
-- Program Templates Migration
-- ============================================================================
-- Adds support for program templates, A/B day designation, intensity
-- tracking, and warm-up protocols

-- Add new columns to programs table
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS days_per_week INTEGER,
  ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS template_category TEXT;

-- Add new columns to workouts table
ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS workout_type TEXT CHECK (workout_type IN ('strength', 'hypertrophy', 'mixed', 'deload')) DEFAULT 'mixed';

-- Add new columns to exercises table
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS intensity_percentage DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS warmup_protocol JSONB DEFAULT '[]'::jsonb;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_programs_is_template ON public.programs(is_template);
CREATE INDEX IF NOT EXISTS idx_programs_template_category ON public.programs(template_category);
CREATE INDEX IF NOT EXISTS idx_workouts_workout_type ON public.workouts(workout_type);

-- Comments for documentation
COMMENT ON COLUMN public.programs.goals IS 'Array of fitness goals (e.g., strength, hypertrophy, endurance)';
COMMENT ON COLUMN public.programs.days_per_week IS 'Number of training days per week';
COMMENT ON COLUMN public.programs.is_template IS 'Whether this is a pre-built template program';
COMMENT ON COLUMN public.programs.template_category IS 'Category for template programs (e.g., push-pull-legs, full-body)';
COMMENT ON COLUMN public.workouts.workout_type IS 'Type of workout: strength (A day), hypertrophy (B day), mixed, or deload';
COMMENT ON COLUMN public.exercises.intensity_percentage IS 'Intensity as percentage of 1RM (e.g., 85.00 for 85%)';
COMMENT ON COLUMN public.exercises.warmup_protocol IS 'Structured warm-up sets as JSON array [{"sets": 1, "reps": 10, "intensity": 50}]';
