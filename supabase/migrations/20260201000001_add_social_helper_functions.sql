-- ============================================================================
-- SOCIAL FEATURES HELPER FUNCTIONS
-- ============================================================================

-- Function to increment template uses count
CREATE OR REPLACE FUNCTION increment_template_uses(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE community_program_templates
  SET uses_count = uses_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update monthly leaderboard stats for a user
CREATE OR REPLACE FUNCTION update_monthly_leaderboard_stats(
  p_user_id UUID,
  p_month_year VARCHAR(7)
)
RETURNS VOID AS $$
DECLARE
  v_workouts_completed INTEGER;
  v_total_volume NUMERIC;
  v_total_xp INTEGER;
  v_prs_achieved INTEGER;
  v_streak_days INTEGER;
BEGIN
  -- Calculate workouts completed this month
  SELECT COUNT(*) INTO v_workouts_completed
  FROM workout_sessions
  WHERE user_id = p_user_id
    AND status = 'completed'
    AND TO_CHAR(completed_at, 'YYYY-MM') = p_month_year;

  -- Calculate total volume this month
  SELECT COALESCE(SUM(total_volume_kg), 0) INTO v_total_volume
  FROM workout_sessions
  WHERE user_id = p_user_id
    AND status = 'completed'
    AND TO_CHAR(completed_at, 'YYYY-MM') = p_month_year;

  -- Calculate XP earned this month
  SELECT COALESCE(SUM(xp_amount), 0) INTO v_total_xp
  FROM xp_transactions
  WHERE user_id = p_user_id
    AND TO_CHAR(created_at, 'YYYY-MM') = p_month_year;

  -- Calculate PRs achieved this month (approximation - count distinct exercises with new max weight)
  SELECT COUNT(DISTINCT exercise_id) INTO v_prs_achieved
  FROM (
    SELECT s.exercise_id, MAX(s.weight_kg) as max_weight
    FROM sets s
    JOIN workout_sessions ws ON s.workout_session_id = ws.id
    WHERE ws.user_id = p_user_id
      AND ws.status = 'completed'
      AND TO_CHAR(ws.completed_at, 'YYYY-MM') = p_month_year
    GROUP BY s.exercise_id
  ) monthly_maxes;

  -- Get current streak
  SELECT COALESCE(current_streak_days, 0) INTO v_streak_days
  FROM workout_streaks
  WHERE user_id = p_user_id;

  -- Upsert monthly stats
  INSERT INTO monthly_leaderboard_stats (
    user_id,
    month_year,
    workouts_completed,
    total_volume_kg,
    total_xp_earned,
    prs_achieved,
    streak_days
  ) VALUES (
    p_user_id,
    p_month_year,
    v_workouts_completed,
    v_total_volume,
    v_total_xp,
    v_prs_achieved,
    v_streak_days
  )
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET
    workouts_completed = v_workouts_completed,
    total_volume_kg = v_total_volume,
    total_xp_earned = v_total_xp,
    prs_achieved = v_prs_achieved,
    streak_days = v_streak_days,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update monthly stats when workout is completed
CREATE OR REPLACE FUNCTION trigger_update_monthly_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM update_monthly_leaderboard_stats(
      NEW.user_id,
      TO_CHAR(NEW.completed_at, 'YYYY-MM')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workout_completed_update_monthly_stats
AFTER INSERT OR UPDATE ON workout_sessions
FOR EACH ROW
EXECUTE FUNCTION trigger_update_monthly_stats();

-- Function to update challenge progress based on workout completion
CREATE OR REPLACE FUNCTION update_challenge_progress_from_workout(
  p_user_id UUID,
  p_workout_session_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_challenge RECORD;
  v_session RECORD;
  v_new_value NUMERIC;
BEGIN
  -- Get workout session details
  SELECT total_volume_kg, completed_at
  INTO v_session
  FROM workout_sessions
  WHERE id = p_workout_session_id;

  -- Loop through active challenges user has joined
  FOR v_challenge IN
    SELECT c.*, ucp.current_value
    FROM weekly_challenges c
    JOIN user_challenge_progress ucp ON ucp.challenge_id = c.id
    WHERE c.is_active = TRUE
      AND ucp.user_id = p_user_id
      AND ucp.completed = FALSE
      AND v_session.completed_at BETWEEN c.start_date AND c.end_date
  LOOP
    v_new_value := v_challenge.current_value;

    -- Update based on challenge type
    IF v_challenge.challenge_type = 'volume' THEN
      v_new_value := v_new_value + v_session.total_volume_kg;
    ELSIF v_challenge.challenge_type = 'workout_count' THEN
      v_new_value := v_new_value + 1;
    END IF;

    -- Update progress
    UPDATE user_challenge_progress
    SET current_value = v_new_value,
        completed = (v_new_value >= v_challenge.target_value),
        completed_at = CASE WHEN v_new_value >= v_challenge.target_value THEN NOW() ELSE NULL END
    WHERE challenge_id = v_challenge.id AND user_id = p_user_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update challenge progress when workout is completed
CREATE OR REPLACE FUNCTION trigger_update_challenge_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM update_challenge_progress_from_workout(NEW.user_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workout_completed_update_challenges
AFTER INSERT OR UPDATE ON workout_sessions
FOR EACH ROW
EXECUTE FUNCTION trigger_update_challenge_progress();

-- Initialize privacy settings for existing users
INSERT INTO user_privacy_settings (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_privacy_settings)
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON FUNCTION increment_template_uses IS 'Increments the usage count for a community template';
COMMENT ON FUNCTION update_monthly_leaderboard_stats IS 'Recalculates and updates monthly leaderboard statistics for a user';
COMMENT ON FUNCTION update_challenge_progress_from_workout IS 'Automatically updates challenge progress when a workout is completed';
