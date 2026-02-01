-- ============================================================================
-- SOCIAL FEATURES MIGRATION
-- Adds comprehensive social layer: friends, challenges, sharing, leaderboards
-- All features are OPT-IN with privacy controls
-- ============================================================================

-- ============================================================================
-- 1. USER PRIVACY SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_visibility VARCHAR(20) DEFAULT 'private' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  workout_sharing VARCHAR(20) DEFAULT 'private' CHECK (workout_sharing IN ('public', 'friends', 'private')),
  show_on_leaderboards BOOLEAN DEFAULT FALSE,
  allow_friend_requests BOOLEAN DEFAULT TRUE,
  allow_partner_matching BOOLEAN DEFAULT FALSE,
  show_strength_scores BOOLEAN DEFAULT FALSE,
  show_location BOOLEAN DEFAULT FALSE,
  location_city VARCHAR(255),
  location_country VARCHAR(255),
  gym_name VARCHAR(255),
  age_group VARCHAR(20) CHECK (age_group IN ('under_18', '18_29', '30_39', '40_49', '50_plus')),
  experience_level VARCHAR(20) CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'elite')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own privacy settings"
  ON user_privacy_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy settings"
  ON user_privacy_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own privacy settings"
  ON user_privacy_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 2. FRIEND SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- RLS Policies
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendship requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendship requests they received"
  ON friendships FOR UPDATE
  USING (auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ============================================================================
-- 3. WORKOUT SHARING & SOCIAL FEED
-- ============================================================================

CREATE TABLE IF NOT EXISTS workout_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  caption TEXT,
  photo_urls TEXT[], -- Array of image URLs
  visibility VARCHAR(20) DEFAULT 'friends' CHECK (visibility IN ('public', 'friends', 'private')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_posts_user_id ON workout_posts(user_id);
CREATE INDEX idx_workout_posts_created_at ON workout_posts(created_at DESC);
CREATE INDEX idx_workout_posts_visibility ON workout_posts(visibility);

-- Post Reactions
CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES workout_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) DEFAULT 'like' CHECK (reaction_type IN ('like', 'fire', 'strong', 'clap', 'heart')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_reactions_post_id ON post_reactions(post_id);
CREATE INDEX idx_post_reactions_user_id ON post_reactions(user_id);

-- Post Comments
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES workout_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_created_at ON post_comments(created_at DESC);

-- RLS Policies for Workout Posts
ALTER TABLE workout_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public posts"
  ON workout_posts FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Users can view friends' posts"
  ON workout_posts FOR SELECT
  USING (
    visibility = 'friends' AND (
      auth.uid() = user_id OR
      EXISTS (
        SELECT 1 FROM friendships
        WHERE status = 'accepted' AND (
          (user_id = auth.uid() AND friend_id = workout_posts.user_id) OR
          (friend_id = auth.uid() AND user_id = workout_posts.user_id)
        )
      )
    )
  );

CREATE POLICY "Users can view their own posts"
  ON workout_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own posts"
  ON workout_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON workout_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON workout_posts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Post Reactions
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions on visible posts"
  ON post_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_posts
      WHERE workout_posts.id = post_reactions.post_id
    )
  );

CREATE POLICY "Users can create their own reactions"
  ON post_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON post_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Post Comments
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments on visible posts"
  ON post_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_posts
      WHERE workout_posts.id = post_comments.post_id
    )
  );

CREATE POLICY "Users can create comments on visible posts"
  ON post_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM workout_posts
      WHERE workout_posts.id = post_comments.post_id
    )
  );

CREATE POLICY "Users can update their own comments"
  ON post_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. WEEKLY CHALLENGES (GUILD QUESTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  challenge_type VARCHAR(50) CHECK (challenge_type IN ('volume', 'pr_count', 'workout_count', 'consistency', 'custom')),
  target_value NUMERIC NOT NULL,
  target_unit VARCHAR(50), -- 'kg', 'reps', 'workouts', 'days', etc.
  xp_multiplier NUMERIC DEFAULT 1.5,
  bonus_xp INTEGER DEFAULT 500,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  participants_count INTEGER DEFAULT 0,
  completions_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weekly_challenges_active ON weekly_challenges(is_active, start_date, end_date);

-- User Challenge Progress
CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES weekly_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_value NUMERIC DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX idx_user_challenge_progress_user_id ON user_challenge_progress(user_id);
CREATE INDEX idx_user_challenge_progress_challenge_id ON user_challenge_progress(challenge_id);

-- RLS Policies
ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges"
  ON weekly_challenges FOR SELECT
  USING (is_active = TRUE);

ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all challenge progress"
  ON user_challenge_progress FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can create their own challenge progress"
  ON user_challenge_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge progress"
  ON user_challenge_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. LEADERBOARDS
-- ============================================================================

-- Monthly Workout Leaderboard (for friends consistency)
CREATE TABLE IF NOT EXISTS monthly_leaderboard_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL, -- 'YYYY-MM'
  workouts_completed INTEGER DEFAULT 0,
  total_volume_kg NUMERIC DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  prs_achieved INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

CREATE INDEX idx_monthly_leaderboard_month ON monthly_leaderboard_stats(month_year);
CREATE INDEX idx_monthly_leaderboard_workouts ON monthly_leaderboard_stats(workouts_completed DESC);
CREATE INDEX idx_monthly_leaderboard_volume ON monthly_leaderboard_stats(total_volume_kg DESC);

-- RLS Policies
ALTER TABLE monthly_leaderboard_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leaderboard stats for opted-in users"
  ON monthly_leaderboard_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_privacy_settings ups
      WHERE ups.user_id = monthly_leaderboard_stats.user_id
      AND ups.show_on_leaderboards = TRUE
    ) OR
    auth.uid() = user_id
  );

CREATE POLICY "Users can insert their own leaderboard stats"
  ON monthly_leaderboard_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leaderboard stats"
  ON monthly_leaderboard_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. TRAINING PARTNER MATCHING
-- ============================================================================

CREATE TABLE IF NOT EXISTS training_partner_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goals TEXT[], -- e.g., ['strength', 'hypertrophy', 'weight_loss']
  available_days TEXT[], -- e.g., ['monday', 'wednesday', 'friday']
  preferred_time VARCHAR(20) CHECK (preferred_time IN ('early_morning', 'morning', 'afternoon', 'evening', 'late_night')),
  bio TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner Requests
CREATE TABLE IF NOT EXISTS partner_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(sender_id, receiver_id)
);

-- Shared Workout Invites
CREATE TABLE IF NOT EXISTS workout_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accountability Check-ins
CREATE TABLE IF NOT EXISTS accountability_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_request_id UUID REFERENCES partner_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE training_partner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view partner profiles if matching is enabled"
  ON training_partner_profiles FOR SELECT
  USING (
    is_active = TRUE AND
    EXISTS (
      SELECT 1 FROM user_privacy_settings ups
      WHERE ups.user_id = training_partner_profiles.user_id
      AND ups.allow_partner_matching = TRUE
    )
  );

CREATE POLICY "Users can manage their own partner profile"
  ON training_partner_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE partner_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view partner requests they're involved in"
  ON partner_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create partner requests"
  ON partner_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update partner requests they received"
  ON partner_requests FOR UPDATE
  USING (auth.uid() = receiver_id);

ALTER TABLE workout_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workout invites they're involved in"
  ON workout_invites FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create workout invites"
  ON workout_invites FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update workout invites they received"
  ON workout_invites FOR UPDATE
  USING (auth.uid() = receiver_id);

ALTER TABLE accountability_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view check-ins for their partnerships"
  ON accountability_checkins FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM partner_requests pr
      WHERE pr.id = accountability_checkins.partner_request_id
      AND (pr.sender_id = auth.uid() OR pr.receiver_id = auth.uid())
    )
  );

CREATE POLICY "Users can create their own check-ins"
  ON accountability_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 7. COMMUNITY TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_program_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'strength', 'hypertrophy', 'powerlifting', 'bodybuilding', etc.
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  duration_weeks INTEGER,
  rating_average NUMERIC(3, 2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  uses_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  tags TEXT[], -- e.g., ['push-pull-legs', 'upper-lower', '5-day']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_community_templates_rating ON community_program_templates(rating_average DESC);
CREATE INDEX idx_community_templates_uses ON community_program_templates(uses_count DESC);
CREATE INDEX idx_community_templates_category ON community_program_templates(category);

-- Template Ratings
CREATE TABLE IF NOT EXISTS template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES community_program_templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

CREATE INDEX idx_template_ratings_template_id ON template_ratings(template_id);

-- RLS Policies
ALTER TABLE community_program_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view community templates"
  ON community_program_templates FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can create their own templates"
  ON community_program_templates FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own templates"
  ON community_program_templates FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own templates"
  ON community_program_templates FOR DELETE
  USING (auth.uid() = creator_id);

ALTER TABLE template_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view template ratings"
  ON template_ratings FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can create their own ratings"
  ON template_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON template_ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. TRIGGERS & FUNCTIONS
-- ============================================================================

-- Update likes count on workout posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE workout_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE workout_posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_likes_count
AFTER INSERT OR DELETE ON post_reactions
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

-- Update comments count on workout posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE workout_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE workout_posts
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comments_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_count();

-- Update challenge participants and completions count
CREATE OR REPLACE FUNCTION update_challenge_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE weekly_challenges
    SET participants_count = participants_count + 1
    WHERE id = NEW.challenge_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.completed = TRUE AND OLD.completed = FALSE THEN
    UPDATE weekly_challenges
    SET completions_count = completions_count + 1
    WHERE id = NEW.challenge_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_challenge_counts
AFTER INSERT OR UPDATE ON user_challenge_progress
FOR EACH ROW
EXECUTE FUNCTION update_challenge_counts();

-- Update template rating average
CREATE OR REPLACE FUNCTION update_template_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_program_templates
  SET
    rating_average = (
      SELECT COALESCE(AVG(rating), 0)
      FROM template_ratings
      WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM template_ratings
      WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
    )
  WHERE id = COALESCE(NEW.template_id, OLD.template_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_template_rating
AFTER INSERT OR UPDATE OR DELETE ON template_ratings
FOR EACH ROW
EXECUTE FUNCTION update_template_rating();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_privacy_settings_updated_at BEFORE UPDATE ON user_privacy_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workout_posts_updated_at BEFORE UPDATE ON workout_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_challenge_progress_updated_at BEFORE UPDATE ON user_challenge_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_partner_profiles_updated_at BEFORE UPDATE ON training_partner_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_program_templates_updated_at BEFORE UPDATE ON community_program_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_template_ratings_updated_at BEFORE UPDATE ON template_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. HELPER VIEWS
-- ============================================================================

-- View for getting friends list with user details
CREATE OR REPLACE VIEW friends_list AS
SELECT
  f.user_id,
  f.friend_id,
  f.status,
  f.requested_at,
  f.responded_at
FROM friendships f
WHERE f.status = 'accepted';

-- View for social feed (combining friends' posts)
CREATE OR REPLACE VIEW social_feed AS
SELECT
  wp.*,
  u.name as user_name,
  u.avatar as user_avatar
FROM workout_posts wp
JOIN users u ON wp.user_id = u.id
WHERE wp.visibility IN ('public', 'friends')
ORDER BY wp.created_at DESC;

COMMENT ON TABLE user_privacy_settings IS 'Privacy and opt-in settings for social features - defaults to private';
COMMENT ON TABLE friendships IS 'Friend connections between users';
COMMENT ON TABLE workout_posts IS 'Shared workouts with photos and captions';
COMMENT ON TABLE post_reactions IS 'Likes and reactions on workout posts';
COMMENT ON TABLE post_comments IS 'Comments on workout posts';
COMMENT ON TABLE weekly_challenges IS 'Guild quests that all users can participate in';
COMMENT ON TABLE user_challenge_progress IS 'Individual progress on weekly challenges';
COMMENT ON TABLE monthly_leaderboard_stats IS 'Monthly statistics for leaderboards';
COMMENT ON TABLE training_partner_profiles IS 'Training partner matchmaking profiles';
COMMENT ON TABLE partner_requests IS 'Training partner connection requests';
COMMENT ON TABLE workout_invites IS 'Invitations to workout together';
COMMENT ON TABLE accountability_checkins IS 'Daily check-ins for training partners';
COMMENT ON TABLE community_program_templates IS 'User-shared training programs';
COMMENT ON TABLE template_ratings IS 'Ratings and reviews for community templates';
