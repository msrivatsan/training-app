-- ============================================================================
-- Iron Quest - Intelligent Progression System Migration
-- ============================================================================
-- This migration adds tables for:
-- 1. Progression history tracking
-- 2. Deload scheduling and management
-- 3. Periodization phases (mesocycles)
-- 4. Performance predictions and milestone tracking
-- ============================================================================

-- ============================================================================
-- PROGRESSION_HISTORY TABLE
-- ============================================================================
-- Tracks weight progression over time for each exercise

CREATE TABLE IF NOT EXISTS public.progression_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exercise_library_id UUID NOT NULL REFERENCES public.exercise_library(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  previous_weight_kg DECIMAL(6, 2),
  new_weight_kg DECIMAL(6, 2) NOT NULL,
  weight_change_kg DECIMAL(6, 2) NOT NULL, -- Can be negative for deloads
  progression_reason TEXT CHECK (progression_reason IN (
    'hit_top_range',      -- Hit top of rep range on all sets
    'consistency',        -- Maintained weight for multiple sessions
    'deload',            -- Scheduled deload
    'fatigue',           -- Auto-regulation triggered deload
    'form_breakdown',    -- User indicated form issues
    'manual'             -- Manual adjustment
  )) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_progression_history_user_id ON public.progression_history(user_id);
CREATE INDEX idx_progression_history_exercise_id ON public.progression_history(exercise_library_id);
CREATE INDEX idx_progression_history_created_at ON public.progression_history(created_at DESC);

-- ============================================================================
-- DELOAD_SCHEDULES TABLE
-- ============================================================================
-- Manages deload week scheduling and tracking

CREATE TABLE IF NOT EXISTS public.deload_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  scheduled_week_start DATE NOT NULL,
  scheduled_week_end DATE NOT NULL,
  status TEXT CHECK (status IN (
    'upcoming',    -- Deload scheduled in future
    'notified',    -- User has been notified
    'active',      -- Currently in deload week
    'completed',   -- Deload week finished
    'skipped'      -- User chose to skip
  )) DEFAULT 'upcoming' NOT NULL,
  volume_reduction_percent INTEGER DEFAULT 40 CHECK (volume_reduction_percent BETWEEN 20 AND 60),
  trigger_reason TEXT CHECK (trigger_reason IN (
    'scheduled',         -- Standard 4-5 week schedule
    'high_rpe',         -- Auto-regulation: RPE too high
    'fatigue',          -- User reported fatigue
    'manual'            -- User requested
  )) NOT NULL,
  notified_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_deload_schedules_user_id ON public.deload_schedules(user_id);
CREATE INDEX idx_deload_schedules_program_id ON public.deload_schedules(program_id);
CREATE INDEX idx_deload_schedules_status ON public.deload_schedules(status);
CREATE INDEX idx_deload_schedules_week_start ON public.deload_schedules(scheduled_week_start);

CREATE TRIGGER update_deload_schedules_updated_at
  BEFORE UPDATE ON public.deload_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PERIODIZATION_PHASES TABLE
-- ============================================================================
-- Defines training mesocycles with specific parameters

CREATE TABLE IF NOT EXISTS public.periodization_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  phase_type TEXT CHECK (phase_type IN (
    'hypertrophy',  -- 8-12 reps, 70-75%
    'strength',     -- 5-8 reps, 80-85%
    'peak',         -- 3-6 reps, 85-90%
    'deload'        -- Recovery week
  )) NOT NULL,
  phase_order INTEGER NOT NULL, -- 1, 2, 3, etc.
  start_week INTEGER NOT NULL,
  end_week INTEGER NOT NULL,
  target_rep_min INTEGER NOT NULL,
  target_rep_max INTEGER NOT NULL,
  intensity_percent_min DECIMAL(4, 1) NOT NULL, -- % of 1RM
  intensity_percent_max DECIMAL(4, 1) NOT NULL,
  target_sets_per_exercise INTEGER DEFAULT 3,
  rest_seconds_compounds INTEGER DEFAULT 180,
  rest_seconds_accessories INTEGER DEFAULT 120,
  description TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_program_phase_order UNIQUE (program_id, phase_order)
);

CREATE INDEX idx_periodization_phases_program_id ON public.periodization_phases(program_id);
CREATE INDEX idx_periodization_phases_is_active ON public.periodization_phases(is_active);

CREATE TRIGGER update_periodization_phases_updated_at
  BEFORE UPDATE ON public.periodization_phases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PERFORMANCE_PREDICTIONS TABLE
-- ============================================================================
-- Stores 1RM predictions and milestone forecasts

CREATE TABLE IF NOT EXISTS public.performance_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exercise_library_id UUID NOT NULL REFERENCES public.exercise_library(id) ON DELETE CASCADE,
  predicted_1rm_kg DECIMAL(6, 2) NOT NULL,
  confidence_score DECIMAL(3, 2) CHECK (confidence_score BETWEEN 0 AND 1), -- 0.0 to 1.0
  based_on_sessions INTEGER NOT NULL, -- Number of recent sessions used
  prediction_method TEXT CHECK (prediction_method IN (
    'epley',           -- Epley formula
    'brzycki',         -- Brzycki formula
    'lombardi',        -- Lombardi formula
    'weighted_average' -- Average of multiple formulas
  )) DEFAULT 'epley' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  valid_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL -- Predictions expire
);

CREATE INDEX idx_performance_predictions_user_id ON public.performance_predictions(user_id);
CREATE INDEX idx_performance_predictions_exercise_id ON public.performance_predictions(exercise_library_id);
CREATE INDEX idx_performance_predictions_valid_until ON public.performance_predictions(valid_until);

-- ============================================================================
-- MILESTONE_TRACKING TABLE
-- ============================================================================
-- Tracks user-defined weight milestones and predicted achievement dates

CREATE TABLE IF NOT EXISTS public.milestone_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exercise_library_id UUID NOT NULL REFERENCES public.exercise_library(id) ON DELETE CASCADE,
  target_weight_kg DECIMAL(6, 2) NOT NULL,
  target_reps INTEGER DEFAULT 1 NOT NULL,
  current_estimated_1rm_kg DECIMAL(6, 2),
  predicted_achievement_date DATE,
  weeks_to_achievement INTEGER,
  achievement_probability DECIMAL(3, 2) CHECK (achievement_probability BETWEEN 0 AND 1),
  status TEXT CHECK (status IN (
    'in_progress',
    'achieved',
    'abandoned'
  )) DEFAULT 'in_progress' NOT NULL,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_milestone_tracking_user_id ON public.milestone_tracking(user_id);
CREATE INDEX idx_milestone_tracking_exercise_id ON public.milestone_tracking(exercise_library_id);
CREATE INDEX idx_milestone_tracking_status ON public.milestone_tracking(status);

CREATE TRIGGER update_milestone_tracking_updated_at
  BEFORE UPDATE ON public.milestone_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RPE_TRACKING TABLE
-- ============================================================================
-- Aggregate RPE data for auto-regulation (extends existing sets.rpe)

CREATE TABLE IF NOT EXISTS public.rpe_weekly_averages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  average_rpe DECIMAL(3, 1) NOT NULL,
  sessions_count INTEGER NOT NULL,
  sets_count INTEGER NOT NULL,
  auto_regulation_recommendation TEXT CHECK (auto_regulation_recommendation IN (
    'maintain',        -- RPE is good (7-8.5)
    'increase_weight', -- RPE too low (<7)
    'deload_suggested', -- RPE too high (>9)
    'take_rest'        -- Consistently high RPE
  )),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_week UNIQUE (user_id, week_start_date)
);

CREATE INDEX idx_rpe_weekly_averages_user_id ON public.rpe_weekly_averages(user_id);
CREATE INDEX idx_rpe_weekly_averages_week_start ON public.rpe_weekly_averages(week_start_date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.progression_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deload_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periodization_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpe_weekly_averages ENABLE ROW LEVEL SECURITY;

-- Progression History Policies
CREATE POLICY "Users can view their own progression history"
  ON public.progression_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progression history"
  ON public.progression_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Deload Schedules Policies
CREATE POLICY "Users can view their own deload schedules"
  ON public.deload_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deload schedules"
  ON public.deload_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deload schedules"
  ON public.deload_schedules FOR UPDATE
  USING (auth.uid() = user_id);

-- Periodization Phases Policies
CREATE POLICY "Users can view phases for their programs"
  ON public.periodization_phases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.programs
      WHERE programs.id = periodization_phases.program_id
      AND programs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert phases for their programs"
  ON public.periodization_phases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.programs
      WHERE programs.id = periodization_phases.program_id
      AND programs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update phases for their programs"
  ON public.periodization_phases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.programs
      WHERE programs.id = periodization_phases.program_id
      AND programs.user_id = auth.uid()
    )
  );

-- Performance Predictions Policies
CREATE POLICY "Users can view their own predictions"
  ON public.performance_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predictions"
  ON public.performance_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own predictions"
  ON public.performance_predictions FOR DELETE
  USING (auth.uid() = user_id);

-- Milestone Tracking Policies
CREATE POLICY "Users can view their own milestones"
  ON public.milestone_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones"
  ON public.milestone_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones"
  ON public.milestone_tracking FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own milestones"
  ON public.milestone_tracking FOR DELETE
  USING (auth.uid() = user_id);

-- RPE Weekly Averages Policies
CREATE POLICY "Users can view their own RPE averages"
  ON public.rpe_weekly_averages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own RPE averages"
  ON public.rpe_weekly_averages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically create deload schedules for new programs
CREATE OR REPLACE FUNCTION schedule_program_deloads()
RETURNS TRIGGER AS $$
DECLARE
  week_counter INTEGER := 4;
  program_start DATE := CURRENT_DATE;
  deload_week_start DATE;
BEGIN
  -- Only schedule deloads for programs longer than 4 weeks
  IF NEW.duration_weeks IS NOT NULL AND NEW.duration_weeks > 4 THEN
    WHILE week_counter < NEW.duration_weeks LOOP
      deload_week_start := program_start + (week_counter * INTERVAL '7 days');

      INSERT INTO public.deload_schedules (
        user_id,
        program_id,
        scheduled_week_start,
        scheduled_week_end,
        trigger_reason,
        status
      ) VALUES (
        NEW.user_id,
        NEW.id,
        deload_week_start,
        deload_week_start + INTERVAL '6 days',
        'scheduled',
        'upcoming'
      );

      -- Schedule next deload 4-5 weeks later (using 5 for consistent scheduling)
      week_counter := week_counter + 5;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-schedule deloads when a program is created
CREATE TRIGGER auto_schedule_deloads
  AFTER INSERT ON public.programs
  FOR EACH ROW
  EXECUTE FUNCTION schedule_program_deloads();

-- Function to calculate weekly RPE averages
CREATE OR REPLACE FUNCTION calculate_weekly_rpe_average(
  p_user_id UUID,
  p_week_start DATE,
  p_week_end DATE
)
RETURNS void AS $$
DECLARE
  v_avg_rpe DECIMAL(3, 1);
  v_sessions_count INTEGER;
  v_sets_count INTEGER;
  v_recommendation TEXT;
BEGIN
  -- Calculate average RPE for the week
  SELECT
    AVG(s.rpe)::DECIMAL(3, 1),
    COUNT(DISTINCT ws.id),
    COUNT(s.id)
  INTO v_avg_rpe, v_sessions_count, v_sets_count
  FROM public.sets s
  JOIN public.workout_sessions ws ON ws.id = s.session_id
  WHERE ws.user_id = p_user_id
    AND s.rpe IS NOT NULL
    AND ws.completed_at >= p_week_start
    AND ws.completed_at < p_week_end + INTERVAL '1 day'
    AND ws.status = 'completed';

  -- Only insert if we have data
  IF v_sets_count > 0 THEN
    -- Determine recommendation based on RPE
    IF v_avg_rpe >= 9.0 THEN
      v_recommendation := 'deload_suggested';
    ELSIF v_avg_rpe >= 8.5 THEN
      v_recommendation := 'maintain';
    ELSIF v_avg_rpe < 7.0 THEN
      v_recommendation := 'increase_weight';
    ELSE
      v_recommendation := 'maintain';
    END IF;

    -- Insert or update the weekly average
    INSERT INTO public.rpe_weekly_averages (
      user_id,
      week_start_date,
      week_end_date,
      average_rpe,
      sessions_count,
      sets_count,
      auto_regulation_recommendation
    ) VALUES (
      p_user_id,
      p_week_start,
      p_week_end,
      v_avg_rpe,
      v_sessions_count,
      v_sets_count,
      v_recommendation
    )
    ON CONFLICT (user_id, week_start_date)
    DO UPDATE SET
      average_rpe = EXCLUDED.average_rpe,
      sessions_count = EXCLUDED.sessions_count,
      sets_count = EXCLUDED.sets_count,
      auto_regulation_recommendation = EXCLUDED.auto_regulation_recommendation;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
