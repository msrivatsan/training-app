-- ============================================================================
-- Migration: Add Exercise Swap and Program Customization Features
-- ============================================================================
-- Adds movement patterns, equipment profiles, exercise notes, and custom templates

-- ============================================================================
-- MOVEMENT PATTERN ENUM
-- ============================================================================
-- Define movement pattern types for exercise classification

DO $$ BEGIN
  CREATE TYPE movement_pattern_type AS ENUM (
    'horizontal_push',  -- Bench Press, Push-ups, Dips
    'vertical_push',    -- OHP, Arnold Press
    'horizontal_pull',  -- Rows, Face Pulls
    'vertical_pull',    -- Pull-ups, Lat Pulldown
    'squat_pattern',    -- Back Squat, Front Squat, Leg Press
    'hinge_pattern',    -- Deadlift, RDL, Good Morning
    'lunge_pattern',    -- Lunges, Split Squats, Step-ups
    'isolation_upper',  -- Curls, Extensions, Raises
    'isolation_lower',  -- Leg Curls, Extensions, Calf Raises
    'core_rotation',    -- Russian Twists, Pallof Press
    'core_stability',   -- Planks, Dead Bugs
    'core_flexion',     -- Crunches, Leg Raises
    'carry',            -- Farmer's Walk, Suitcase Carry
    'explosive',        -- Box Jumps, Medicine Ball Slams
    'olympic'           -- Clean and Press, Thrusters
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- ADD MOVEMENT PATTERN TO EXERCISE LIBRARY
-- ============================================================================

ALTER TABLE public.exercise_library
ADD COLUMN IF NOT EXISTS movement_pattern movement_pattern_type;

CREATE INDEX IF NOT EXISTS idx_exercise_library_movement_pattern
  ON public.exercise_library(movement_pattern);

-- ============================================================================
-- EQUIPMENT PROFILES TABLE
-- ============================================================================
-- Store user's available equipment for filtering exercise substitutions

CREATE TABLE IF NOT EXISTS public.equipment_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL DEFAULT 'Default',
  available_equipment TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, profile_name)
);

CREATE INDEX idx_equipment_profiles_user_id ON public.equipment_profiles(user_id);
CREATE INDEX idx_equipment_profiles_is_active ON public.equipment_profiles(is_active);

CREATE TRIGGER update_equipment_profiles_updated_at
  BEFORE UPDATE ON public.equipment_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for Equipment Profiles
ALTER TABLE public.equipment_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own equipment profiles"
  ON public.equipment_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own equipment profiles"
  ON public.equipment_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own equipment profiles"
  ON public.equipment_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own equipment profiles"
  ON public.equipment_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- EXERCISE NOTES TABLE
-- ============================================================================
-- Per-exercise notes that carry over across all instances of that exercise

CREATE TABLE IF NOT EXISTS public.exercise_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exercise_library_id UUID NOT NULL REFERENCES public.exercise_library(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, exercise_library_id)
);

CREATE INDEX idx_exercise_notes_user_id ON public.exercise_notes(user_id);
CREATE INDEX idx_exercise_notes_exercise_library_id ON public.exercise_notes(exercise_library_id);
CREATE INDEX idx_exercise_notes_is_pinned ON public.exercise_notes(is_pinned);

CREATE TRIGGER update_exercise_notes_updated_at
  BEFORE UPDATE ON public.exercise_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for Exercise Notes
ALTER TABLE public.exercise_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exercise notes"
  ON public.exercise_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exercise notes"
  ON public.exercise_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise notes"
  ON public.exercise_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercise notes"
  ON public.exercise_notes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CUSTOM WORKOUT TEMPLATES TABLE
-- ============================================================================
-- Save custom workout templates created by users

CREATE TABLE IF NOT EXISTS public.custom_workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL, -- Stores workout structure and exercises
  is_public BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_custom_workout_templates_user_id ON public.custom_workout_templates(user_id);
CREATE INDEX idx_custom_workout_templates_is_public ON public.custom_workout_templates(is_public);

CREATE TRIGGER update_custom_workout_templates_updated_at
  BEFORE UPDATE ON public.custom_workout_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for Custom Workout Templates
ALTER TABLE public.custom_workout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom templates"
  ON public.custom_workout_templates FOR SELECT
  USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can create their own custom templates"
  ON public.custom_workout_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom templates"
  ON public.custom_workout_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom templates"
  ON public.custom_workout_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- EXERCISE SWAP HISTORY TABLE
-- ============================================================================
-- Track exercise swaps for analytics and suggestions

CREATE TABLE IF NOT EXISTS public.exercise_swap_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  original_exercise_id UUID REFERENCES public.exercise_library(id) ON DELETE SET NULL,
  swapped_exercise_id UUID NOT NULL REFERENCES public.exercise_library(id) ON DELETE CASCADE,
  reason TEXT, -- Optional: why the swap was made
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_exercise_swap_history_user_id ON public.exercise_swap_history(user_id);
CREATE INDEX idx_exercise_swap_history_original_exercise ON public.exercise_swap_history(original_exercise_id);
CREATE INDEX idx_exercise_swap_history_swapped_exercise ON public.exercise_swap_history(swapped_exercise_id);

-- RLS Policies for Exercise Swap History
ALTER TABLE public.exercise_swap_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own swap history"
  ON public.exercise_swap_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own swap history"
  ON public.exercise_swap_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- UPDATE EXERCISE LIBRARY WITH MOVEMENT PATTERNS
-- ============================================================================
-- Classify existing exercises by movement pattern

-- Priority Compound Lifts
UPDATE public.exercise_library SET movement_pattern = 'horizontal_push' WHERE name = 'Barbell Bench Press';
UPDATE public.exercise_library SET movement_pattern = 'vertical_push' WHERE name = 'Overhead Press (OHP)';
UPDATE public.exercise_library SET movement_pattern = 'horizontal_push' WHERE name = 'Weighted Dips';
UPDATE public.exercise_library SET movement_pattern = 'vertical_pull' WHERE name = 'Weighted Pull-ups';
UPDATE public.exercise_library SET movement_pattern = 'squat_pattern' WHERE name = 'Barbell Squat';
UPDATE public.exercise_library SET movement_pattern = 'hinge_pattern' WHERE name = 'Conventional Deadlift';
UPDATE public.exercise_library SET movement_pattern = 'hinge_pattern' WHERE name = 'Romanian Deadlift';

-- Push Day Exercises
UPDATE public.exercise_library SET movement_pattern = 'horizontal_push' WHERE name = 'Incline Dumbbell Press';
UPDATE public.exercise_library SET movement_pattern = 'isolation_upper' WHERE name = 'Lateral Raise';
UPDATE public.exercise_library SET movement_pattern = 'isolation_upper' WHERE name = 'Tricep Extension';
UPDATE public.exercise_library SET movement_pattern = 'horizontal_push' WHERE name = 'Cable Flyes';
UPDATE public.exercise_library SET movement_pattern = 'vertical_push' WHERE name = 'Dumbbell Shoulder Press';
UPDATE public.exercise_library SET movement_pattern = 'horizontal_push' WHERE name = 'Chest Dips';
UPDATE public.exercise_library SET movement_pattern = 'horizontal_push' WHERE name = 'Close-Grip Bench Press';
UPDATE public.exercise_library SET movement_pattern = 'horizontal_push' WHERE name = 'Cable Crossover';
UPDATE public.exercise_library SET movement_pattern = 'isolation_upper' WHERE name = 'Front Raise';
UPDATE public.exercise_library SET movement_pattern = 'isolation_upper' WHERE name = 'Skull Crushers';
UPDATE public.exercise_library SET movement_pattern = 'horizontal_push' WHERE name = 'Incline Barbell Bench Press';
UPDATE public.exercise_library SET movement_pattern = 'vertical_push' WHERE name = 'Arnold Press';
UPDATE public.exercise_library SET movement_pattern = 'horizontal_push' WHERE name = 'Decline Bench Press';

-- Pull Day Exercises
UPDATE public.exercise_library SET movement_pattern = 'horizontal_pull' WHERE name = 'Chest-Supported Dumbbell Row';
UPDATE public.exercise_library SET movement_pattern = 'vertical_pull' WHERE name = 'Lat Pulldown';
UPDATE public.exercise_library SET movement_pattern = 'horizontal_pull' WHERE name = 'Face Pulls';
UPDATE public.exercise_library SET movement_pattern = 'isolation_upper' WHERE name = 'Incline Dumbbell Curl';
UPDATE public.exercise_library SET movement_pattern = 'horizontal_pull' WHERE name = 'Barbell Row';
UPDATE public.exercise_library SET movement_pattern = 'horizontal_pull' WHERE name = 'Dumbbell Row';
UPDATE public.exercise_library SET movement_pattern = 'horizontal_pull' WHERE name = 'Single-Arm Dumbbell Row';
UPDATE public.exercise_library SET movement_pattern = 'horizontal_pull' WHERE name = 'Rear Delt Fly';
UPDATE public.exercise_library SET movement_pattern = 'isolation_upper' WHERE name = 'Cable Curl';
UPDATE public.exercise_library SET movement_pattern = 'isolation_upper' WHERE name = 'Hammer Curl';
UPDATE public.exercise_library SET movement_pattern = 'horizontal_pull' WHERE name = 'T-Bar Row';
UPDATE public.exercise_library SET movement_pattern = 'horizontal_pull' WHERE name = 'Seated Cable Row';
UPDATE public.exercise_library SET movement_pattern = 'isolation_upper' WHERE name = 'Preacher Curl';
UPDATE public.exercise_library SET movement_pattern = 'isolation_upper' WHERE name = 'Barbell Curl';
UPDATE public.exercise_library SET movement_pattern = 'vertical_pull' WHERE name = 'Chin-ups';
UPDATE public.exercise_library SET movement_pattern = 'isolation_upper' WHERE name = 'Shrugs';

-- Leg Day Exercises
UPDATE public.exercise_library SET movement_pattern = 'squat_pattern' WHERE name = 'Pause Squats';
UPDATE public.exercise_library SET movement_pattern = 'lunge_pattern' WHERE name = 'Bulgarian Split Squat';
UPDATE public.exercise_library SET movement_pattern = 'isolation_lower' WHERE name = 'Leg Extension';
UPDATE public.exercise_library SET movement_pattern = 'isolation_lower' WHERE name = 'Hamstring Curl';
UPDATE public.exercise_library SET movement_pattern = 'isolation_lower' WHERE name = 'Calf Raise';
UPDATE public.exercise_library SET movement_pattern = 'squat_pattern' WHERE name = 'Front Squat';
UPDATE public.exercise_library SET movement_pattern = 'squat_pattern' WHERE name = 'Leg Press';
UPDATE public.exercise_library SET movement_pattern = 'lunge_pattern' WHERE name = 'Walking Lunges';
UPDATE public.exercise_library SET movement_pattern = 'squat_pattern' WHERE name = 'Goblet Squat';
UPDATE public.exercise_library SET movement_pattern = 'squat_pattern' WHERE name = 'Hack Squat';
UPDATE public.exercise_library SET movement_pattern = 'hinge_pattern' WHERE name = 'Sumo Deadlift';
UPDATE public.exercise_library SET movement_pattern = 'hinge_pattern' WHERE name = 'Good Morning';
UPDATE public.exercise_library SET movement_pattern = 'hinge_pattern' WHERE name = 'Hip Thrust';
UPDATE public.exercise_library SET movement_pattern = 'lunge_pattern' WHERE name = 'Step-ups';

-- Core/Abs Exercises
UPDATE public.exercise_library SET movement_pattern = 'core_flexion' WHERE name = 'Hanging Leg Raises';
UPDATE public.exercise_library SET movement_pattern = 'core_flexion' WHERE name = 'Cable Crunches';
UPDATE public.exercise_library SET movement_pattern = 'core_stability' WHERE name = 'Planks';
UPDATE public.exercise_library SET movement_pattern = 'core_stability' WHERE name = 'Dead Bugs';
UPDATE public.exercise_library SET movement_pattern = 'core_flexion' WHERE name = 'Ab Wheel Rollout';
UPDATE public.exercise_library SET movement_pattern = 'core_rotation' WHERE name = 'Russian Twist';
UPDATE public.exercise_library SET movement_pattern = 'core_flexion' WHERE name = 'Bicycle Crunches';
UPDATE public.exercise_library SET movement_pattern = 'core_stability' WHERE name = 'Mountain Climbers';
UPDATE public.exercise_library SET movement_pattern = 'core_stability' WHERE name = 'Side Plank';
UPDATE public.exercise_library SET movement_pattern = 'core_flexion' WHERE name = 'Leg Raises';
UPDATE public.exercise_library SET movement_pattern = 'core_flexion' WHERE name = 'Dragon Flag';

-- Additional Compound & Functional Exercises
UPDATE public.exercise_library SET movement_pattern = 'olympic' WHERE name = 'Clean and Press';
UPDATE public.exercise_library SET movement_pattern = 'olympic' WHERE name = 'Thrusters';
UPDATE public.exercise_library SET movement_pattern = 'explosive' WHERE name = 'Burpees';
UPDATE public.exercise_library SET movement_pattern = 'explosive' WHERE name = 'Box Jumps';
UPDATE public.exercise_library SET movement_pattern = 'carry' WHERE name = 'Farmers Walk';
UPDATE public.exercise_library SET movement_pattern = 'hinge_pattern' WHERE name = 'Kettlebell Swing';
UPDATE public.exercise_library SET movement_pattern = 'olympic' WHERE name = 'Turkish Get-Up';
UPDATE public.exercise_library SET movement_pattern = 'explosive' WHERE name = 'Battle Ropes';
UPDATE public.exercise_library SET movement_pattern = 'squat_pattern' WHERE name = 'Sled Push';
UPDATE public.exercise_library SET movement_pattern = 'explosive' WHERE name = 'Medicine Ball Slam';

-- Mobility & Accessory
UPDATE public.exercise_library SET movement_pattern = 'isolation_upper' WHERE name = 'Wall Angels';
UPDATE public.exercise_library SET movement_pattern = 'isolation_upper' WHERE name = 'Band Pull-Aparts';
UPDATE public.exercise_library SET movement_pattern = 'core_rotation' WHERE name = 'Pallof Press';
UPDATE public.exercise_library SET movement_pattern = 'core_stability' WHERE name = 'Bird Dog';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get alternative exercises based on movement pattern and muscle group
CREATE OR REPLACE FUNCTION get_exercise_alternatives(
  p_exercise_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  exercise_id UUID,
  exercise_name TEXT,
  primary_muscle_group TEXT,
  movement_pattern movement_pattern_type,
  equipment_needed TEXT[],
  difficulty_level TEXT,
  is_compound BOOLEAN,
  compatibility_score INTEGER
) AS $$
DECLARE
  v_movement_pattern movement_pattern_type;
  v_primary_muscle TEXT;
  v_difficulty TEXT;
  v_available_equipment TEXT[];
BEGIN
  -- Get the source exercise details
  SELECT
    el.movement_pattern,
    el.primary_muscle_group,
    el.difficulty_level
  INTO v_movement_pattern, v_primary_muscle, v_difficulty
  FROM public.exercise_library el
  WHERE el.id = p_exercise_id;

  -- Get user's available equipment if user_id provided
  IF p_user_id IS NOT NULL THEN
    SELECT ep.available_equipment
    INTO v_available_equipment
    FROM public.equipment_profiles ep
    WHERE ep.user_id = p_user_id AND ep.is_active = TRUE
    LIMIT 1;
  END IF;

  -- Return alternative exercises with compatibility scoring
  RETURN QUERY
  SELECT
    el.id,
    el.name,
    el.primary_muscle_group,
    el.movement_pattern,
    el.equipment_needed,
    el.difficulty_level,
    el.is_compound,
    -- Compatibility score (0-100)
    (
      CASE WHEN el.movement_pattern = v_movement_pattern THEN 50 ELSE 0 END +
      CASE WHEN el.primary_muscle_group = v_primary_muscle THEN 30 ELSE 0 END +
      CASE WHEN el.difficulty_level = v_difficulty THEN 10 ELSE 0 END +
      CASE
        WHEN v_available_equipment IS NULL THEN 10
        WHEN el.equipment_needed <@ v_available_equipment THEN 10
        ELSE 0
      END
    ) AS compatibility_score
  FROM public.exercise_library el
  WHERE
    el.id != p_exercise_id
    AND (
      el.movement_pattern = v_movement_pattern
      OR el.primary_muscle_group = v_primary_muscle
    )
    -- Filter by equipment if specified
    AND (
      v_available_equipment IS NULL
      OR el.equipment_needed <@ v_available_equipment
      OR array_length(el.equipment_needed, 1) = 0
    )
  ORDER BY compatibility_score DESC, el.is_compound DESC, el.name
  LIMIT 20;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
